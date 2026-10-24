import type { Stream } from "./stations";

export interface ScanLog {
  id: string;
  stationId?: string; // absent for Recycle Buddy scans (not tied to a bin)
  item: string;
  stream: Stream;
  binColor: string;
  reason: string;
  confidence: number;
  recyclable: boolean;
  demo?: boolean; // seeded example, not a real scan
  lang: "hi" | "en";
  createdAt: string;
}

export interface Report {
  id: string;
  stationId: string;
  stream: Stream;
  status: "overflowing" | "full" | "mixed" | "ok";
  via: "voice" | "web";
  lang: "hi" | "en";
  note?: string;
  createdAt: string;
  clearedAt?: string;
}

// Demo-grade persistence: an in-memory store kept on `globalThis` so it
// survives Next.js dev hot-reloads and (best-effort) warm serverless
// instances on Vercel during a live demo. This is NOT durable across cold
// starts/redeploys — see SETUP.md for swapping in a real DB if you need
// that guarantee.
interface Store {
  scans: ScanLog[];
  reports: Report[];
}

// Demo seed so the impact counter and dashboard aren't empty on a fresh
// (cold-started) instance. Typical campus items with their standard
// classification; flagged `demo` and labelled as demo data in the UI.
const DEMO_ITEMS: [string, Stream, boolean][] = [
  ["PET water bottle", "dry", true],
  ["Chips packet (multilayer)", "dry", false],
  ["Banana peel", "wet", true],
  ["AA battery", "hazardous", false],
  ["Newspaper", "dry", true],
  ["Tetra Pak juice carton", "dry", true],
  ["Plastic-lined paper cup", "dry", false],
  ["Used face mask", "sanitary", false],
  ["Aluminium soft-drink can", "dry", true],
  ["Leftover rice and dal", "wet", true],
  ["Cardboard box", "dry", true],
  ["Thermocol plate", "dry", false],
  ["Tea leaves", "wet", true],
  ["Glass sauce bottle", "dry", true],
  ["Dead phone charger", "hazardous", true],
  ["Sanitary pad", "sanitary", false],
  ["Plastic straw", "dry", false],
  ["Notebook paper", "dry", true],
  ["Egg shells", "wet", true],
  ["CFL bulb", "hazardous", false],
];

function demoScans(): ScanLog[] {
  const now = Date.now();
  return DEMO_ITEMS.map(([item, stream, recyclable], i) => ({
    id: `demo_${i}`,
    item,
    stream,
    binColor: { wet: "Green bin", dry: "Blue bin", hazardous: "Red bin", sanitary: "Yellow bin" }[stream],
    reason: "",
    confidence: 0.9,
    recyclable,
    lang: "hi" as const,
    demo: true,
    createdAt: new Date(now - (i + 1) * 17 * 60 * 1000).toISOString(),
  }));
}

const g = globalThis as unknown as { __binbolStore?: Store };

if (!g.__binbolStore) {
  g.__binbolStore = { scans: demoScans(), reports: [] };
}

export const store = g.__binbolStore;

export function addScan(scan: Omit<ScanLog, "id" | "createdAt">): ScanLog {
  const entry: ScanLog = {
    ...scan,
    id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  store.scans.unshift(entry);
  return entry;
}

export function addReport(report: Omit<Report, "id" | "createdAt">): Report {
  const entry: Report = {
    ...report,
    id: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  store.reports.unshift(entry);
  return entry;
}
