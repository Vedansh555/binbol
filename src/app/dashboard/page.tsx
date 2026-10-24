"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ImpactStrip from "../ImpactStrip";

interface ScanLog {
  id: string;
  stationId?: string;
  item: string;
  stream: string;
  binColor: string;
  confidence: number;
  createdAt: string;
}

interface Report {
  id: string;
  stationId: string;
  stream: string;
  status: string;
  via: string;
  note?: string;
  createdAt: string;
}

interface RouteStop {
  stationId: string;
  stationName: string;
  landmark: string;
  stream: string;
  status: string;
  score: number;
}

export default function DashboardPage() {
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [route, setRoute] = useState<{ stops: RouteStop[]; briefHindi: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [briefState, setBriefState] = useState<"idle" | "loading" | "playing">("idle");

  // Collection staff often can't read an English dashboard, so the route is
  // also spoken as a Hindi audio brief via ElevenLabs.
  async function playBrief() {
    if (!route || briefState !== "idle") return;
    setBriefState("loading");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: route.briefHindi }),
      });
      if (!res.ok) throw new Error();
      const audio = new Audio(URL.createObjectURL(await res.blob()));
      audio.onended = () => setBriefState("idle");
      setBriefState("playing");
      await audio.play();
    } catch {
      setBriefState("idle");
    }
  }

  const refresh = useCallback(async () => {
    setLoading(true);
    const [scansRes, reportsRes, routeRes] = await Promise.all([
      fetch("/api/scans").then((r) => r.json()),
      fetch("/api/reports").then((r) => r.json()),
      fetch("/api/route-plan").then((r) => r.json()),
    ]);
    setScans(scansRes.scans ?? []);
    setReports(reportsRes.reports ?? []);
    setRoute(routeRes);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount, not a render loop
    refresh();
  }, [refresh]);

  const streamCounts = scans.reduce<Record<string, number>>((acc, s) => {
    acc[s.stream] = (acc[s.stream] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← BinBol
        </Link>
        <button
          onClick={refresh}
          className="text-sm border border-neutral-300 rounded-full px-3 py-1 hover:border-black"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <h1 className="text-3xl font-black mt-3">Dashboard</h1>
      <p className="text-sm text-neutral-600 mt-1">
        4-stream log, open reports, and today&apos;s urgency-scored route.
      </p>

      <div className="mt-6">
        <ImpactStrip />
      </div>

      <div className="mt-4 grid sm:grid-cols-4 gap-3">
        {(["wet", "dry", "hazardous", "sanitary"] as const).map((s) => (
          <div key={s} className={`stream-${s} rounded-xl p-4`}>
            <div className="text-3xl font-black">{streamCounts[s] ?? 0}</div>
            <div className="text-sm uppercase tracking-wide opacity-90">{s} scans</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-lg">Today&apos;s route</h2>
            {route && (
              <button
                onClick={playBrief}
                disabled={briefState !== "idle"}
                className="text-sm rounded-full bg-black text-white px-4 py-1.5 font-semibold disabled:opacity-60"
              >
                {briefState === "loading"
                  ? "Preparing…"
                  : briefState === "playing"
                    ? "🔊 Playing…"
                    : "🔊 Play Hindi route brief"}
              </button>
            )}
          </div>
          {route && (
            <p className="text-sm italic text-neutral-500 mt-1">
              &ldquo;{route.briefHindi}&rdquo;
            </p>
          )}
          <div className="mt-3 rounded-xl border border-neutral-300 divide-y">
            {route?.stops.length ? (
              route.stops.map((stop, i) => (
                <div key={stop.stationId + i} className="p-3 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">
                      {i + 1}. {stop.stationName}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {stop.landmark} · {stop.stream} · {stop.status}
                    </div>
                  </div>
                  <div className="text-sm font-mono text-neutral-600">
                    score {stop.score}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-neutral-400">
                No open reports — file one from the Call &amp; Report page.
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-bold text-lg">Reports</h2>
          <div className="mt-3 rounded-xl border border-neutral-300 divide-y max-h-96 overflow-auto">
            {reports.length ? (
              reports.map((r) => (
                <div key={r.id} className="p-3 text-sm">
                  <span className="font-semibold">{r.stationId}</span> ·{" "}
                  {r.stream} · {r.status}{" "}
                  <span className="text-neutral-400">
                    ({r.via}, {new Date(r.createdAt).toLocaleTimeString()})
                  </span>
                  {r.note && <div className="text-neutral-500 mt-1">{r.note}</div>}
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-neutral-400">No reports yet.</div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="font-bold text-lg">Scan log</h2>
        <div className="mt-3 rounded-xl border border-neutral-300 divide-y max-h-80 overflow-auto">
          {scans.length ? (
            scans.map((s) => (
              <div key={s.id} className="p-3 text-sm flex justify-between">
                <span>
                  <span className="font-semibold">{s.stationId ?? "Buddy"}</span> ·{" "}
                  {s.item} →{" "}
                  <span className={`stream-${s.stream} px-2 py-0.5 rounded-full text-xs`}>
                    {s.stream}
                  </span>
                  {s.confidence < 0.55 && (
                    <span className="ml-2 text-xs rounded-full border-2 border-dashed border-black px-2 py-0.5 font-bold">
                      needs review
                    </span>
                  )}
                </span>
                <span className="text-neutral-400">
                  {new Date(s.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-neutral-400">
              No scans yet — try Scan &amp; Speak.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
