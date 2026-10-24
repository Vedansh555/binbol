import Link from "next/link";
import type { Bin, Station, Stream } from "@/lib/stations";

const COLOR: Record<Stream, string> = {
  wet: "#1e7a46",
  dry: "#1f5fae",
  hazardous: "#c0392b",
  sanitary: "#b8960c",
};

const WHAT_GOES_IN: Record<Stream, string> = {
  wet: "Food, peels, tea leaves",
  dry: "Plastic, paper, cans, glass",
  hazardous: "Batteries, e-waste, bulbs",
  sanitary: "Masks, pads, diapers",
};

// Every bin at one station: its stream and exact spot. No fill levels — we
// have no sensors, so we don't pretend to know how full a bin is.
export default function StationDetail({ station, bins }: { station: Station; bins: Bin[] }) {
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
          <span className="rounded-full border-2 border-black px-4 py-1.5 text-sm font-bold">{bins.length} bins</span>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {bins.map((b) => (
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

              {/* the bin, drawn in its stream colour */}
              <div className="mt-4 mx-auto w-20">
                <div className="h-2.5 rounded-t-md mx-[-6px]" style={{ background: COLOR[b.stream] }} />
                <div
                  className="h-24 border-[3px] border-t-0 border-black rounded-b-xl"
                  style={{
                    background: `repeating-linear-gradient(135deg, ${COLOR[b.stream]}22 0 6px, transparent 6px 12px)`,
                  }}
                />
              </div>

              <div className="mt-4 text-xs text-neutral-600">{WHAT_GOES_IN[b.stream]}</div>
              <div className="mt-2 text-sm font-semibold flex items-start gap-1">
                <PinIcon small /> <span>{b.spot}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-neutral-400">
          Bin spots are a planned layout, to be confirmed on a campus walk-through.
        </p>
      </div>
    </main>
  );
}

function PinIcon({ small = false }: { small?: boolean }) {
  const s = small ? 13 : 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
