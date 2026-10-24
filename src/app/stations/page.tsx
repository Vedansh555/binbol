import Link from "next/link";
import { STATIONS, type Stream } from "@/lib/stations";

const STREAMS: Stream[] = ["wet", "dry", "hazardous", "sanitary"];

// Plain directory of bin stations: where they are and how many bins of each
// stream sit there. Tap a row for each bin's exact spot.
// Deliberately no camera here: scanning happens in Recycle Buddy.
export default function StationsPage() {
  const totals = STREAMS.map((st) => STATIONS.reduce((n, s) => n + s.bins[st], 0));
  const totalBins = totals.reduce((a, b) => a + b, 0);

  return (
    <main className="flex-1 w-full">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← BinBol
        </Link>

        <h1 className="text-4xl font-black tracking-tight mt-6">Bin stations</h1>
        <p className="text-neutral-600 mt-1">
          {STATIONS.length} stations · {totalBins} bins across campus
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          {STREAMS.map((st, i) => (
            <span key={st} className={`stream-${st} px-3 py-1 rounded-full font-semibold capitalize`}>
              {st} · {totals[i]}
            </span>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border-2 border-black overflow-hidden">
          <div className="hidden sm:grid grid-cols-[90px_1fr_repeat(4,56px)_56px] gap-2 px-5 py-3 bg-black text-white text-xs uppercase tracking-wide">
            <span>Station</span>
            <span>Location</span>
            {STREAMS.map((st) => (
              <span key={st} className="text-center">{st === "hazardous" ? "Haz" : st === "sanitary" ? "San" : st}</span>
            ))}
            <span className="text-center">Total</span>
          </div>

          {STATIONS.map((s) => {
            const place = s.name.split(" - ")[0];
            const spot = s.landmark.split(", ").slice(1).join(", ") || s.landmark;
            const total = STREAMS.reduce((n, st) => n + s.bins[st], 0);
            return (
              <Link
                key={s.id}
                href={`/stations/${s.id}`}
                className="group hover:bg-neutral-50 transition-colors grid grid-cols-[1fr_auto] sm:grid-cols-[90px_1fr_repeat(4,56px)_56px] gap-2 items-center px-5 py-3.5 border-t border-neutral-200 first:border-t-0"
              >
                <span className="font-mono text-xs text-neutral-500 sm:order-none order-first col-span-2 sm:col-span-1">
                  {s.id}
                </span>
                <div>
                  <div className="font-bold group-hover:underline">{place} <span className="text-neutral-400 font-normal">→</span></div>
                  <div className="text-sm text-neutral-500 capitalize">{spot}</div>
                </div>
                {STREAMS.map((st) => (
                  <span
                    key={st}
                    className={`hidden sm:block text-center font-mono ${s.bins[st] ? "font-bold" : "text-neutral-300"}`}
                  >
                    {s.bins[st]}
                  </span>
                ))}
                <span className="text-center font-black">
                  {total}
                  <span className="sm:hidden text-xs font-normal text-neutral-500"> bins</span>
                </span>
              </Link>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-neutral-400">
          Bin counts are a planned layout for the pilot, to be confirmed on a campus walk-through.
        </p>
      </div>
    </main>
  );
}
