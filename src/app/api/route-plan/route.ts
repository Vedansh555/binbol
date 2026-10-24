import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { buildTodaysRoute, routeBriefScript } from "@/lib/scoring";

export async function GET() {
  const stops = buildTodaysRoute(store.reports);
  const briefHindi = routeBriefScript(stops, "hi");
  const briefEnglish = routeBriefScript(stops, "en");
  return NextResponse.json({ stops, briefHindi, briefEnglish });
}
