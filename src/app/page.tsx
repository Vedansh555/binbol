import Link from "next/link";
import { STATIONS } from "@/lib/stations";
import Bin3D from "./Bin3D";

export default function Home() {
  return (
    <main className="flex-1 w-full">
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-10 grid md:grid-cols-[1.1fr_auto] gap-10 items-center">
        <div>
          <h1 className="text-6xl font-black tracking-tight">BinBol</h1>
          <p className="text-xl italic text-neutral-600 mt-2">
            Know where every item goes.
          </p>
          <p className="mt-4 text-neutral-700 max-w-xl">
            Point your phone camera at anything you&apos;re about to throw away.
            BinBol tells you the right bin, whether it can be recycled, and
            exactly how — in Hindi or English. No app to install.
          </p>

          <Link
            href="/buddy"
            className="card-lift mt-7 inline-flex items-center gap-3 rounded-full bg-black text-white pl-5 pr-6 py-3.5 text-base font-bold"
          >
            <CameraIcon />
            Scan an item
          </Link>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 rounded-full border border-black">4-stream segregation</span>
            <span className="px-3 py-1 rounded-full border border-black">Recycling guidance</span>
            <span className="px-3 py-1 rounded-full border border-black">Zero new hardware</span>
          </div>
        </div>

        <div className="mx-auto">
          <Bin3D />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard"
            className="card-lift block rounded-2xl border-2 border-black p-5 hover:bg-black hover:text-white"
          >
            <div className="flex items-center gap-2">
              <ChartIcon />
              <span className="text-xs uppercase tracking-wide opacity-60">For the estate office</span>
            </div>
            <div className="text-lg font-bold mt-2">Dashboard</div>
            <div className="text-sm mt-2 opacity-70">
              Daily 4-stream log, open bin reports and the morning pickup route.
            </div>
          </Link>

          <Link
            href="/stations"
            className="card-lift block rounded-2xl border-2 border-black p-5 hover:bg-black hover:text-white"
          >
            <div className="flex items-center gap-2">
              <PinIcon />
              <span className="text-xs uppercase tracking-wide opacity-60">Campus</span>
            </div>
            <div className="text-lg font-bold mt-2">Bin stations</div>
            <div className="text-sm mt-2 opacity-70">
              {STATIONS.length} stations — where the bins are and how many.
            </div>
          </Link>
        </div>
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

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
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
