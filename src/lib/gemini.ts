// Vision classification via Google Gemini (free tier via AI Studio — no
// credit card needed, see SETUP.md). Swap this file if you'd rather use
// OpenAI or Anthropic vision; the rest of the app only depends on
// classifyWasteImage's return shape.

export interface ClassifyResult {
  item: string;
  stream: "wet" | "dry" | "hazardous" | "sanitary";
  binColor: string;
  reason: string;
  confidence: number; // 0-1
  spokenHindi: string;
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
Respond with ONLY a compact JSON object, no markdown fences, no extra text, in this exact shape:
{"item": "short name of the item", "stream": "wet|dry|hazardous|sanitary", "reason": "one short sentence explaining why, mention contamination/lining if relevant", "confidence": 0.0-1.0}
Be decisive. If an item is a composite (e.g. a plastic-lined paper cup), classify by the dominant disposal-relevant material and say so in the reason.`;

export async function classifyWasteImage(
  imageBase64: string,
  mimeType: string
): Promise<ClassifyResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to .env.local — see SETUP.md.");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  let parsed: { item: string; stream: ClassifyResult["stream"]; reason: string; confidence: number };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback if the model wraps the JSON in prose.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Could not parse Gemini response: ${text}`);
    parsed = JSON.parse(match[0]);
  }

  const stream = parsed.stream;
  const binColor = STREAM_BIN_COLOR[stream] ?? "Blue bin";

  return {
    item: parsed.item,
    stream,
    binColor,
    reason: parsed.reason,
    confidence: parsed.confidence ?? 0.7,
    spokenHindi: `${hindiStreamName(stream)}. ${hindiBinColor(stream)}.`,
    spokenEnglish: `${stream} waste. ${binColor}.`,
  };
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
