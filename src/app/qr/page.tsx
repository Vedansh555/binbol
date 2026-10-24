"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STATIONS } from "@/lib/stations";

// Printable sheet of QR codes, one per bin station. Each code points at
// /scan/<stationId> on this same deployment, so sticking a printed code on
// a real (or pretend, for the live demo) bin is literally all the "install"
// a station needs.
//
// QR images come from the free api.qrserver.com service (no key, no
// account) rather than bundling a QR library — fine for a hackathon demo,
// but if you want this fully offline-capable later, swap in the `qrcode`
// npm package and generate SVGs locally instead.
export default function QrPage() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- window is unavailable during SSR, this just picks up the real origin once mounted
    setOrigin(window.location.origin);
  }, []);

  return (
    <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full print:px-0 print:py-0">
      <div className="print:hidden flex items-center justify-between">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← BinBol
        </Link>
        <button
          onClick={() => window.print()}
          className="text-sm rounded-full bg-black text-white px-4 py-2"
        >
          Print / Save as PDF
        </button>
      </div>

      <h1 className="text-3xl font-black mt-4 print:hidden">
        Station QR codes
      </h1>
      <p className="text-sm text-neutral-600 mt-1 print:hidden">
        One code per bin station, linking to its Scan &amp; Speak page. Print
        this page and stick a code on (or next to) each real bin — or tape
        them to stand-ins for the live demo.
      </p>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 print:grid-cols-2 gap-6 print:gap-4">
        {STATIONS.map((s) => {
          const url = origin ? `${origin}/scan/${s.id}` : "";
          const qrSrc = url
            ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(url)}`
            : "";
          return (
            <div
              key={s.id}
              className="border-2 border-black rounded-xl p-4 flex flex-col items-center text-center break-inside-avoid"
            >
              {qrSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrSrc} alt={`QR code for ${s.id}`} className="w-40 h-40" />
              )}
              <div className="mt-3 font-black text-lg">{s.id}</div>
              <div className="text-sm text-neutral-600">{s.landmark}</div>
              <div className="text-xs text-neutral-400 mt-1 break-all">{url}</div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
