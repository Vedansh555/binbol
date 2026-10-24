import Link from "next/link";
import { STATIONS } from "@/lib/stations";

export default function Home() {
  return (
    <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
      <h1 className="text-5xl font-black tracking-tight">BinBol</h1>
      <p className="text-xl italic text-neutral-600 mt-2">
        Give campus waste a voice.
      </p>
      <p className="mt-4 text-neutral-700 max-w-xl">
        A voice + camera layer that helps a campus segregate, collect and
        report its waste. No app to install — a phone camera and a voice is
        enough.
      </p>

      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        <Link
          href={`/scan/${STATIONS[0].id}`}
          className="block rounded-xl border-2 border-black p-5 hover:bg-black hover:text-white transition-colors"
        >
          <div className="text-xs uppercase tracking-wide opacity-60">A · Scan</div>
          <div className="text-lg font-bold mt-1">Scan &amp; Speak</div>
          <div className="text-sm mt-2 opacity-70">
            Photograph an item, hear which bin it goes in.
          </div>
        </Link>

        <Link
          href="/call"
          className="block rounded-xl border-2 border-black p-5 hover:bg-black hover:text-white transition-colors"
        >
          <div className="text-xs uppercase tracking-wide opacity-60">B · Talk</div>
          <div className="text-lg font-bold mt-1">Call &amp; Report</div>
          <div className="text-sm mt-2 opacity-70">
            Speak in Hindi to report a full or overflowing bin.
          </div>
        </Link>

        <Link
          href="/dashboard"
          className="block rounded-xl border-2 border-black p-5 hover:bg-black hover:text-white transition-colors"
        >
          <div className="text-xs uppercase tracking-wide opacity-60">C · Monitor</div>
          <div className="text-lg font-bold mt-1">Dashboard</div>
          <div className="text-sm mt-2 opacity-70">
            Today&apos;s 4-stream log and the morning collection route.
          </div>
        </Link>
      </div>

      <div className="mt-12 text-sm text-neutral-500">
        <div className="font-semibold text-neutral-700 mb-1">Demo bin stations</div>
        <div className="flex flex-wrap gap-2">
          {STATIONS.map((s) => (
            <Link
              key={s.id}
              href={`/scan/${s.id}`}
              className="px-2 py-1 rounded border border-neutral-300 hover:border-black"
            >
              {s.id} · {s.landmark}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
