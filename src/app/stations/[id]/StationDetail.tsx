import Link from "next/link";
import type { Bin, Station, Stream } from "@/lib/stations";

const STREAMS: Stream[] = ["wet", "dry", "hazardous", "sanitary"];

const COLOR: Record<Stream, string> = {
  wet: "#1e7a46",
  dry: "#1f5fae",
  hazardous: "#c0392b",
  sanitary: "#b8960c",
};

const LABEL: Record<Stream, string> = {
  wet: "Wet waste · Green bin",
  dry: "Dry waste · Blue bin",
  hazardous: "Hazardous · Red bin",
  sanitary: "Sanitary · Yellow bin",
};

const WHAT_GOES_IN: Record<Stream, string> = {
  wet: "Food, peels, tea leaves, egg shells",
  dry: "Plastic, paper, cans, glass, cartons",
  hazardous: "Batteries, e-waste, bulbs, chemicals",
  sanitary: "Masks, pads, diapers, bandages",
};

// Every bin at one station, grouped by stream, with its exact spot. No fill
// levels: there are no sensors, so we don't pretend to know how full a bin is.
export default function StationDetail({ station, bins }: { station: Station; bins: Bin[] }) {
  const place = station.name.split(" - ")[0];
  const groups = STREAMS.map((st) => ({ st, items: bins.filter((b) => b.stream === st) })).filter((g) => g.items.length);

  return (
    <main className="flex-1 w-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Link href="/stations" className="text-sm text-neutral-500 hover:underline">
          ← All stations
        </Link>

        <div className="mt-5 rounded-3xl bg-black text-white p-6 sm:p-8">
          <div className="font-mono text-xs tracking-wider text-white/50">{station.id}</div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none mt-1">{place}</h1>
          <p className="text-white/70 mt-3 flex items-center gap-1.5">
            <PinIcon /> {station.landmark}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-white text-black px-4 py-1.5 text-sm font-black">{bins.length} bins</span>
            {groups.map((g) => (
              <span
                key={g.st}
                className="rounded-full px-4 py-1.5 text-sm font-bold capitalize"
                style={{ background: COLOR[g.st] }}
              >
                {g.items.length} {g.st}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {groups.map((g) => (
            <section key={g.st}>
              <div className="flex items-center gap-3">
                <span className="w-3 h-8 rounded-full" style={{ background: COLOR[g.st] }} />
                <div>
                  <h2 className="font-black text-lg leading-none">{LABEL[g.st]}</h2>
                  <p className="text-sm text-neutral-500 mt-1">{WHAT_GOES_IN[g.st]}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.items.map((b) => (
                  <div key={b.id} className="card-lift rounded-2xl border-2 border-black bg-white p-4 flex items-center gap-4">
                    <BinIcon color={COLOR[b.stream]} />
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] text-neutral-500">{b.id}</div>
                      <div className="font-bold leading-snug flex items-start gap-1 mt-0.5">
                        <PinIcon small /> <span>{b.spot}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 text-xs text-neutral-400">
          Bin spots are a planned layout, to be confirmed on a campus walk-through.
        </p>
      </div>
    </main>
  );
}

function BinIcon({ color }: { color: string }) {
  return (
    <svg width="40" height="52" viewBox="0 0 40 52" className="shrink-0" aria-hidden="true">
      <rect x="15" y="1" width="10" height="4" rx="2" fill="#0a0a0a" />
      <rect x="1" y="5" width="38" height="7" rx="2" fill={color} stroke="#0a0a0a" strokeWidth="2" />
      <path d="M5 13 h30 l-2.6 35 a3 3 0 0 1 -3 2.8 h-18.8 a3 3 0 0 1 -3 -2.8 z" fill={color} stroke="#0a0a0a" strokeWidth="2" />
      <path d="M14 20 v22 M20 20 v22 M26 20 v22" stroke="#fff" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon({ small = false }: { small?: boolean }) {
  const s = small ? 14 : 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
