import type { Stream } from "./stations";

export interface ScanLog {
  id: string;
  stationId: string;
  item: string;
  stream: Stream;
  binColor: string;
  reason: string;
  confidence: number;
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

const g = globalThis as unknown as { __binbolStore?: Store };

if (!g.__binbolStore) {
  g.__binbolStore = { scans: [], reports: [] };
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
