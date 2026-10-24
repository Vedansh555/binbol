import Link from "next/link";
import { STATIONS, type Stream } from "@/lib/stations";

const STREAMS: Stream[] = ["wet", "dry", "hazardous", "sanitary"];
const COLOR: Record<Stream, string> = {
  wet: "#1e7a46",
  dry: "#1f5fae",
  hazardous: "#c0392b",
  sanitary: "#b8960c",
};

// Directory of bin stations: where they are and what bins sit there. Tap a
// card for each bin's exact spot. No camera here: scanning is Recycle Buddy.
export default function StationsPage() {
  const totals = STREAMS.map((st) => STATIONS.reduce((n, s) => n + s.bins[st], 0));
  const totalBins = totals.reduce((a, b) => a + b, 0);

  return (
    <main className="flex-1 w-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← BinBol
        </Link>

        <div className="mt-5 rounded-3xl bg-black text-white p-6 sm:p-8">
          <div className="text-xs uppercase tracking-widest text-white/60">Campus directory</div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mt-1">Bin stations</h1>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-2xl bg-white text-black px-4 py-3">
              <div className="text-3xl font-black">{STATIONS.length}</div>
              <div className="text-xs text-neutral-500">stations</div>
            </div>
            {STREAMS.map((st, i) => (
              <div key={st} className="rounded-2xl px-4 py-3" style={{ background: COLOR[st] }}>
                <div className="text-3xl font-black">{totals[i]}</div>
                <div className="text-xs capitalize text-white/80">{st} bins</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-white/60">{totalBins} bins in total</div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STATIONS.map((s) => {
            const place = s.name.split(" - ")[0];
            const spot = s.landmark.split(", ").slice(1).join(", ") || s.landmark;
            const total = STREAMS.reduce((n, st) => n + s.bins[st], 0);
            return (
              <Link
                key={s.id}
                href={`/stations/${s.id}`}
                className="card-lift group rounded-2xl border-2 border-black p-5 bg-white flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[11px] tracking-wider text-neutral-500">{s.id}</div>
                    <div className="text-xl font-black leading-tight mt-0.5">{place}</div>
                    <div className="text-sm text-neutral-500 capitalize">{spot}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-black leading-none">{total}</div>
                    <div className="text-xs text-neutral-500">bins</div>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div className="flex flex-wrap items-end gap-1.5">
                    {STREAMS.flatMap((st) =>
                      Array.from({ length: s.bins[st] }, (_, i) => <MiniBin key={`${st}${i}`} color={COLOR[st]} />)
                    )}
                  </div>
                  <span className="text-sm font-bold flex items-center gap-1 shrink-0">
                    View bins <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-neutral-400">
          Bin counts and spots are a planned layout for the pilot, to be confirmed on a campus walk-through.
        </p>
      </div>
    </main>
  );
}

function MiniBin({ color }: { color: string }) {
  return (
    <svg width="16" height="22" viewBox="0 0 16 22" aria-hidden="true">
      <rect x="0.5" y="2" width="15" height="3" rx="1" fill={color} />
      <path d="M2 5.5 h12 l-1.2 15 a1.5 1.5 0 0 1 -1.5 1.3 h-6.6 a1.5 1.5 0 0 1 -1.5 -1.3 z" fill={color} />
    </svg>
  );
}
