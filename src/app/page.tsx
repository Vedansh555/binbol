import Link from "next/link";
import { STATIONS } from "@/lib/stations";

export default function Home() {
  return (
    <main className="flex-1 w-full">
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-10 grid md:grid-cols-[1.1fr_auto] gap-10 items-center">
        <div>
          <h1 className="text-6xl font-black tracking-tight">BinBol</h1>
          <p className="text-xl italic text-neutral-600 mt-2">
            Give campus waste a voice.
          </p>
          <p className="mt-4 text-neutral-700 max-w-xl">
            A voice + camera layer that helps a campus segregate, collect and
            report its waste. No app to install — a phone camera and a voice
            is enough.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-black text-white">
              4-stream segregation
            </span>
            <span className="px-3 py-1 rounded-full border border-black">
              Hindi voice agent
            </span>
            <span className="px-3 py-1 rounded-full border border-black">
              Zero new hardware
            </span>
          </div>
        </div>

        <div className="bin3d-scene mx-auto" aria-hidden="true">
          <div className="bin3d-rig">
            <div className="bin3d-shadow" />
            <div className="bin3d-body" />
            <div className="bin3d-label">BinBol</div>
            <div className="bin3d-lid" />
            <div className="bin3d-knob" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href={`/scan/${STATIONS[0].id}`}
            className="card-lift block rounded-2xl border-2 border-black p-5 hover:bg-black hover:text-white"
          >
            <div className="flex items-center gap-2">
              <CameraIcon />
              <span className="text-xs uppercase tracking-wide opacity-60">
                A · Scan
              </span>
            </div>
            <div className="text-lg font-bold mt-2">Scan &amp; Speak</div>
            <div className="text-sm mt-2 opacity-70">
              Photograph an item, hear which bin it goes in.
            </div>
          </Link>

          <Link
            href="/call"
            className="card-lift block rounded-2xl border-2 border-black p-5 hover:bg-black hover:text-white"
          >
            <div className="flex items-center gap-2">
              <MicIcon />
              <span className="text-xs uppercase tracking-wide opacity-60">
                B · Talk
              </span>
            </div>
            <div className="text-lg font-bold mt-2">Call &amp; Report</div>
            <div className="text-sm mt-2 opacity-70">
              Speak in Hindi to report a full or overflowing bin.
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="card-lift block rounded-2xl border-2 border-black p-5 hover:bg-black hover:text-white"
          >
            <div className="flex items-center gap-2">
              <ChartIcon />
              <span className="text-xs uppercase tracking-wide opacity-60">
                C · Monitor
              </span>
            </div>
            <div className="text-lg font-bold mt-2">Dashboard</div>
            <div className="text-sm mt-2 opacity-70">
              Today&apos;s 4-stream log and the morning collection route.
            </div>
          </Link>
        </div>

        <Link
          href="/stations"
          className="card-lift group mt-6 flex items-center justify-between rounded-2xl bg-black text-white px-6 py-5"
        >
          <div>
            <div className="text-xs uppercase tracking-wide opacity-60">
              Bin stations
            </div>
            <div className="text-lg font-bold mt-1">
              {STATIONS.length} stations across campus
            </div>
          </div>
          <span className="text-2xl transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </main>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
