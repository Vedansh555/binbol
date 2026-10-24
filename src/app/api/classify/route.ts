import { NextRequest, NextResponse } from "next/server";
import { classifyWasteImage } from "@/lib/gemini";
import { addScan } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType, stationId, lang } = body as {
      imageBase64: string;
      mimeType: string;
      stationId?: string;
      lang?: "hi" | "en";
    };

    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
    }

    const result = await classifyWasteImage(imageBase64, mimeType || "image/jpeg");

    // The assistant's "can I recycle this?" camera isn't tied to a bin
    // station, so it doesn't count toward the station scan log.
    if (!stationId) return NextResponse.json(result);

    const scan = addScan({
      stationId,
      item: result.item,
      stream: result.stream,
      binColor: result.binColor,
      reason: result.reason,
      confidence: result.confidence,
      lang: lang ?? "hi",
    });

    return NextResponse.json({ ...result, scanId: scan.id });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
