import { NextRequest, NextResponse } from "next/server";
import { addReport, store } from "@/lib/store";
import { findStation, matchStationByText } from "@/lib/stations";

// POST is the ticket-creation endpoint. It's used by:
//  1. The web "Call & Report" fallback form.
//  2. The ElevenLabs Conversational AI agent, wired up as a server tool
//     (webhook) — see SETUP.md for the exact tool schema to paste into the
//     ElevenLabs agent config.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { stationId } = body as { stationId?: string };
    const { stream, status, via, lang, note, landmarkText } = body as {
      stream: "wet" | "dry" | "hazardous" | "sanitary";
      status: "overflowing" | "full" | "mixed" | "ok";
      via: "voice" | "web";
      lang?: "hi" | "en";
      note?: string;
      landmarkText?: string;
    };

    if (!stationId && landmarkText) {
      const match = matchStationByText(landmarkText);
      stationId = match?.id;
    }

    if (!stationId || !findStation(stationId)) {
      return NextResponse.json(
        {
          error:
            "Could not resolve a known station id. Pass a valid stationId, or landmarkText matching a known station.",
        },
        { status: 400 }
      );
    }

    if (!stream || !status) {
      return NextResponse.json(
        { error: "stream and status are required" },
        { status: 400 }
      );
    }

    const report = addReport({
      stationId,
      stream,
      status,
      via: via ?? "voice",
      lang: lang ?? "hi",
      note,
    });

    return NextResponse.json({ ok: true, ticket: report });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ reports: store.reports });
}
