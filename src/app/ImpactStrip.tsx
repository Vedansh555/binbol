"use client";

import { useEffect, useState } from "react";

interface Impact {
  checked: number;
  recyclable: number;
  recyclablePct: number;
  hazardous: number;
  demo: number;
}

// Live counters fed by every Recycle Buddy scan; refreshes every 10s so the
// numbers climb on screen during a demo.
export default function ImpactStrip() {
  const [data, setData] = useState<Impact | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/impact")
        .then((r) => r.json())
        .then((d: Impact) => alive && setData(d))
        .catch(() => {});
    load();
    const t = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const tiles = [
    { n: data?.checked ?? 0, label: "items checked" },
    { n: data?.recyclable ?? 0, label: "recyclables found" },
    { n: `${data?.recyclablePct ?? 0}%`, label: "were recyclable" },
    { n: data?.hazardous ?? 0, label: "hazardous caught" },
  ];

  return (
    <div className="rounded-2xl border-2 border-black overflow-hidden">
      <div className="flex items-center justify-between px-5 py-2.5 bg-black text-white text-xs uppercase tracking-wide">
        <span>Live campus impact</span>
        <span className="flex items-center gap-1.5 normal-case tracking-normal">
          <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse" />
          {data?.demo ? `live · incl. ${data.demo} demo items` : "live from every scan"}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {tiles.map((t, i) => (
          <div key={t.label} className={`px-5 py-4 border-black ${i % 2 ? "border-l-2" : ""} ${i >= 2 ? "border-t-2 sm:border-t-0 sm:border-l-2" : ""}`}>
            <div className="text-3xl font-black tabular-nums">{t.n}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
