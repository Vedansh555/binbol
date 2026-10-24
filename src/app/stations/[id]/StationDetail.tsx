"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Bin, Station, Stream } from "@/lib/stations";

const COLOR: Record<Stream, string> = {
  wet: "#1e7a46",
  dry: "#1f5fae",
  hazardous: "#c0392b",
  sanitary: "#b8960c",
};

interface Report {
  stationId: string;
  stream: Stream;
  status: "overflowing" | "full" | "mixed" | "ok";
  clearedAt?: string;
}

function statusOf(fill: number) {
  if (fill >= 95) return "Overflowing";
  if (fill >= 75) return "Full";
  if (fill >= 40) return "Half full";
  return "Has space";
}

// Every bin at one station: its stream, exact spot, and fill level. Fill is
// an estimate from time since pickup; an open staff report for that stream
// overrides it (full -> 90%, overflowing -> 100%).
export default function StationDetail({ station, bins }: { station: Station; bins: Bin[] }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => setReports(d.reports ?? []))
      .catch(() => {});
    const t = setTimeout(() => setShown(true), 80); // let the fill animate up from 0
    return () => clearTimeout(t);
  }, []);

  const open = reports.filter((r) => r.stationId === station.id && !r.clearedAt);
  const live = bins.map((b) => {
    const rep = open.find((r) => r.stream === b.stream);
    const fill = rep?.status === "overflowing" ? 100 : rep?.status === "full" ? Math.max(b.fill, 90) : b.fill;
    return { ...b, fill, reported: Boolean(rep) };
  });
  const urgent = live.filter((b) => b.fill >= 75).length;
  const place = station.name.split(" - ")[0];

  return (
    <main className="flex-1 w-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Link href="/stations" className="text-sm text-neutral-500 hover:underline">
          ← All stations
        </Link>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs tracking-wider text-neutral-500">{station.id}</div>
            <h1 className="text-4xl font-black tracking-tight leading-none mt-1">{place}</h1>
            <p className="text-neutral-600 mt-2 flex items-center gap-1.5">
              <PinIcon /> {station.landmark}
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="rounded-full border-2 border-black px-4 py-1.5 font-bold">{live.length} bins</span>
            <span className={`rounded-full px-4 py-1.5 font-bold ${urgent ? "bg-black text-white" : "border-2 border-black"}`}>
              {urgent} need pickup
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {live.map((b, i) => (
            <div key={b.id} className="card-lift rounded-2xl border-2 border-black p-4 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-neutral-500">{b.id}</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded-full"
                  style={{ background: COLOR[b.stream] }}
                >
                  {b.stream}
                </span>
              </div>

              {/* the bin */}
              <div className="mt-4 mx-auto w-24">
                <div className="h-2.5 rounded-t-md mx-[-6px]" style={{ background: COLOR[b.stream] }} />
                <div className="relative h-32 border-[3px] border-t-0 border-black rounded-b-xl overflow-hidden bg-white">
                  <div
                    className="absolute inset-x-0 bottom-0 transition-[height] ease-out"
                    style={{
                      height: shown ? `${b.fill}%` : "0%",
                      transitionDuration: `${900 + i * 120}ms`,
                      background: `repeating-linear-gradient(135deg, ${COLOR[b.stream]} 0 6px, ${COLOR[b.stream]}cc 6px 12px)`,
                    }}
                  >
                    <div className="absolute -top-1 inset-x-0 h-2 bg-white/40 rounded-full fill-wave" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white/90 rounded-md px-1.5 text-lg font-black tabular-nums">{b.fill}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 font-bold text-sm">
                {statusOf(b.fill)}
                {b.reported && <span className="ml-1.5 text-[10px] font-bold uppercase border-2 border-black rounded-full px-1.5">reported</span>}
              </div>
              <div className="mt-1 text-xs text-neutral-500 flex items-start gap-1">
                <PinIcon small /> <span>{b.spot}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-neutral-400">
          Fill levels are estimates from time since last pickup, overridden live by staff reports. Bin spots are a planned
          layout, to be confirmed on a campus walk-through.
        </p>
      </div>
    </main>
  );
}

function PinIcon({ small = false }: { small?: boolean }) {
  const s = small ? 12 : 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
