import { NextRequest, NextResponse } from "next/server";
import { askAssistant } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { question } = (await req.json()) as { question?: string };
    if (!question || !question.trim()) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }
    if (question.length > 500) {
      return NextResponse.json({ error: "question is too long" }, { status: 400 });
    }
    const answer = await askAssistant(question.trim());
    return NextResponse.json({ answer });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
