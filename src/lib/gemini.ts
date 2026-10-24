// Vision classification + assistant answers via Google Gemini (free tier via
// AI Studio — no credit card needed, see SETUP.md). Swap this file if you'd
// rather use OpenAI or Anthropic; the rest of the app only depends on the
// exported functions' return shapes.

// gemini-3.5-flash answers in ~5s with JSON mode. gemini-3.8-flash "thinks"
// by default: it took ~97s and its thinking ate the output budget, cutting
// the JSON off mid-object. 3.5-flash still spends some output tokens on
// thinking, so the budget is generous to keep answers from truncating.
const MODEL = "gemini-3.5-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";

export interface ClassifyResult {
  item: string;
  stream: "wet" | "dry" | "hazardous" | "sanitary";
  binColor: string;
  reason: string;
  confidence: number; // 0-1
  recyclable: boolean;
  recycleSteps: string[];
  scrapValue: string; // e.g. "₹10–15/kg at a kabadiwala", empty if none
  spokenHindi: string; // natural Hindi (Devanagari) for the voice to speak
  spokenEnglish: string;
}

const STREAM_BIN_COLOR: Record<ClassifyResult["stream"], string> = {
  wet: "Green bin",
  dry: "Blue bin",
  hazardous: "Red bin",
  sanitary: "Yellow bin",
};

const SYSTEM_PROMPT = `You are BinBol, a waste-sorting assistant for an Indian college campus.
You will be shown one photo of a single item someone is about to throw away.
Classify it into exactly one stream: "wet" (biodegradable/food waste), "dry" (recyclable: plastic, paper, metal, glass), "hazardous" (batteries, chemicals, e-waste, sharp objects), or "sanitary" (diapers, masks, sanitary pads, bandages).
Also say whether it can realistically be recycled in India, and if so, how.
Respond with a JSON object in exactly this shape:
{"item": "short name of the item", "stream": "wet|dry|hazardous|sanitary", "reason": "one short sentence explaining why, mention contamination/lining if relevant", "confidence": 0.0-1.0, "recyclable": true|false, "recycleSteps": ["2-3 short practical steps, e.g. rinse it, flatten it, give to the kabadiwala / e-waste drop point; or composting for food waste; empty array if it truly cannot be recycled"], "scrapValue": "typical Indian kabadiwala rate if it has resale value, e.g. ₹10-15/kg; empty string if none", "speakHindi": "what a friendly helper would say aloud in natural spoken Hindi, in Devanagari script, 2-3 short sentences: whether it is recyclable, which bin colour, and how to recycle it"}
Be decisive. If an item is a composite (e.g. a plastic-lined paper cup), classify by the dominant disposal-relevant material and say so in the reason.`;

async function callGemini(parts: unknown[], maxOutputTokens = 4096): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to .env.local — see SETUP.md.");
  }

  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens,
      responseMimeType: "application/json",
    },
  });

  // Google returns 503 "high demand" spikes now and then; fall back to the
  // lite model rather than failing a scan in the middle of a demo.
  let lastError = "";
  for (const model of [MODEL, FALLBACK_MODEL]) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body }
    );
    if (res.ok) {
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }
    lastError = `Gemini API error ${res.status}: ${await res.text()}`;
    if (![429, 500, 503].includes(res.status)) break;
  }
  throw new Error(lastError);
}

function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback if the model wraps the JSON in prose.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Could not parse Gemini response: ${text}`);
    parsed = JSON.parse(match[0]);
  }
  // Some models occasionally wrap a single object in an array.
  return (Array.isArray(parsed) ? parsed[0] : parsed) as T;
}

export async function classifyWasteImage(
  imageBase64: string,
  mimeType: string
): Promise<ClassifyResult> {
  const text = await callGemini([
    { text: SYSTEM_PROMPT },
    { inline_data: { mime_type: mimeType, data: imageBase64 } },
  ]);

  const parsed = parseJson<{
    item: string;
    stream: ClassifyResult["stream"];
    reason: string;
    confidence: number | string;
    recyclable?: boolean;
    recycleSteps?: string[];
    scrapValue?: string;
    speakHindi?: string;
  }>(text);

  const stream = STREAM_BIN_COLOR[parsed.stream] ? parsed.stream : "dry";
  const binColor = STREAM_BIN_COLOR[stream];

  return {
    item: parsed.item,
    stream,
    binColor,
    reason: parsed.reason,
    confidence: Number(parsed.confidence ?? 0.7),
    recyclable: Boolean(parsed.recyclable),
    recycleSteps: Array.isArray(parsed.recycleSteps) ? parsed.recycleSteps.slice(0, 4) : [],
    scrapValue: typeof parsed.scrapValue === "string" ? parsed.scrapValue : "",
    spokenHindi: parsed.speakHindi?.trim() || `${hindiStreamName(stream)}. ${hindiBinColor(stream)}.`,
    spokenEnglish: `${stream} waste. ${binColor}.`,
  };
}

const ASSISTANT_PROMPT = `You are BinBol's friendly assistant on an Indian college campus (IIT Roorkee).
You help people with waste segregation (wet/dry/hazardous/sanitary bins), recycling, composting, e-waste, and using BinBol: the Recycle Buddy camera checks any item (right bin, recyclable or not, how, scrap value), and the estate office has a dashboard. Bins have no QR codes and there is no bin-reporting feature, so never suggest either.
Reply in the user's language (Hindi, Hinglish or English). Keep it short and practical: at most 3 sentences.
If asked something unrelated to waste or BinBol, politely steer back.
Respond with a JSON object: {"answer": "your reply as text", "speakHindi": "the same reply in natural spoken Hindi, Devanagari script, for a voice to read aloud"}`;

export async function askAssistant(question: string): Promise<{ answer: string; speakHindi: string }> {
  const text = await callGemini(
    [{ text: ASSISTANT_PROMPT }, { text: `User: ${question}` }]
  );
  const r = parseJson<{ answer: string; speakHindi?: string }>(text);
  return { answer: r.answer, speakHindi: r.speakHindi?.trim() || r.answer };
}

function hindiStreamName(stream: ClassifyResult["stream"]): string {
  switch (stream) {
    case "wet":
      return "Geela kachra";
    case "dry":
      return "Sukha kachra";
    case "hazardous":
      return "Khatarnak kachra";
    case "sanitary":
      return "Sanitary kachra";
  }
}

function hindiBinColor(stream: ClassifyResult["stream"]): string {
  switch (stream) {
    case "wet":
      return "Hari bin";
    case "dry":
      return "Neeli bin";
    case "hazardous":
      return "Laal bin";
    case "sanitary":
      return "Peeli bin";
  }
}
