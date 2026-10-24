"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { STATIONS, type Station } from "@/lib/stations";

// Station names end in " - Wet" / " - Dry" / " - Mixed"; split that off so
// the card can show the place and the bin type separately.
function parse(s: Station) {
  const [place, type = ""] = s.name.split(" - ");
  return { place, type: type.toLowerCase() };
}

const TYPE_STYLE: Record<string, string> = {
  wet: "stream-wet",
  dry: "stream-dry",
  mixed: "bg-black text-white",
};

export default function StationsPage() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return STATIONS;
    return STATIONS.filter((s) =>
      [s.id, s.name, s.landmark].some((f) => f.toLowerCase().includes(t))
    );
  }, [q]);

  return (
    <main className="flex-1 w-full">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-neutral-500 hover:underline">
            ← BinBol
          </Link>
          <Link
            href="/qr"
            className="text-sm rounded-full border-2 border-black px-4 py-1.5 hover:bg-black hover:text-white transition-colors"
          >
            Print QR codes
          </Link>
        </div>

        <h1 className="text-4xl font-black tracking-tight mt-6">Bin stations</h1>
        <p className="text-neutral-600 mt-1">
          {STATIONS.length} stations across campus. Tap one to scan an item there.
        </p>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a bhawan, mess, library…"
          className="mt-6 w-full sm:w-96 rounded-full border-2 border-black px-5 py-2.5 outline-none focus:shadow-[0_0_0_4px_rgba(0,0,0,0.08)]"
        />

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const { place, type } = parse(s);
            return (
              <Link
                key={s.id}
                href={`/scan/${s.id}`}
                className="card-lift group rounded-2xl border-2 border-black p-5 bg-white flex flex-col"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-xs tracking-wider text-neutral-500">
                    {s.id}
                  </span>
                  {type && (
                    <span
                      className={`${TYPE_STYLE[type] ?? "bg-black text-white"} text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full`}
                    >
                      {type}
                    </span>
                  )}
                </div>
                <div className="mt-3 text-xl font-black leading-tight">{place}</div>
                <div className="text-sm text-neutral-500 mt-1 capitalize">
                  {s.landmark.split(", ").slice(1).join(", ") || s.landmark}
                </div>
                <div className="mt-5 pt-4 border-t border-neutral-200 flex items-center justify-between text-sm font-semibold">
                  <span>Scan &amp; Speak</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="mt-10 text-neutral-500">No station matches “{q}”.</p>
        )}
      </div>
    </main>
  );
}
