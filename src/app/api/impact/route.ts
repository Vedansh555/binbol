import { NextResponse } from "next/server";
import { store } from "@/lib/store";

// Live campus impact, computed from every Recycle Buddy scan.
export async function GET() {
  const scans = store.scans;
  const checked = scans.length;
  const recyclable = scans.filter((s) => s.recyclable).length;
  const hazardous = scans.filter((s) => s.stream === "hazardous").length;
  return NextResponse.json({
    checked,
    recyclable,
    recyclablePct: checked ? Math.round((recyclable / checked) * 100) : 0,
    hazardous,
    demo: scans.filter((s) => s.demo).length,
  });
}
