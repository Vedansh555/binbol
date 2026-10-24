"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { STATIONS } from "@/lib/stations";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

export default function CallPage() {
  const [stationId, setStationId] = useState(STATIONS[0].id);
  const [stream, setStream] = useState<"wet" | "dry" | "hazardous" | "sanitary">("wet");
  const [status, setStatus] = useState<"overflowing" | "full" | "mixed">("overflowing");
  const [note, setNote] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitFallback() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId, stream, status, via: "web", lang: "hi", note }),
      });
      const data = await res.json();
      if (res.ok) setTicket(data.ticket.id);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 max-w-md mx-auto px-6 py-10 w-full">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← BinBol
      </Link>

      <div className="mt-4 rounded-2xl border-2 border-black p-5">
        <div className="text-xs uppercase tracking-wide opacity-60">B · Call &amp; Report</div>
        <h1 className="text-2xl font-black mt-1">Bolo. Bin sun raha hai.</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Speak. The bin is listening. Report a full or overflowing bin in your
          own words — Hindi or English.
        </p>

        {AGENT_ID ? (
          <div className="mt-5">
            <Script
              src="https://unpkg.com/@elevenlabs/convai-widget-embed"
              strategy="afterInteractive"
            />
            {/* @ts-expect-error -- custom element from ElevenLabs widget script */}
            <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border-2 border-dashed border-black p-3 text-sm">
            Voice agent not configured yet — set{" "}
            <code>NEXT_PUBLIC_ELEVENLABS_AGENT_ID</code> in <code>.env.local</code>{" "}
            (see SETUP.md) to show the live mic widget here. Using the manual
            fallback form below in the meantime.
          </div>
        )}

        <div className="mt-6 border-t border-neutral-200 pt-5">
          <div className="text-xs uppercase tracking-wide opacity-60 mb-2">
            Manual fallback (same ticket endpoint the voice agent uses)
          </div>
          <label className="block text-sm font-medium">Station</label>
          <select
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            className="w-full mt-1 border border-neutral-300 rounded-lg p-2"
          >
            {STATIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.landmark}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium mt-3">Stream</label>
          <select
            value={stream}
            onChange={(e) => setStream(e.target.value as typeof stream)}
            className="w-full mt-1 border border-neutral-300 rounded-lg p-2"
          >
            <option value="wet">Wet</option>
            <option value="dry">Dry</option>
            <option value="hazardous">Hazardous</option>
            <option value="sanitary">Sanitary</option>
          </select>

          <label className="block text-sm font-medium mt-3">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="w-full mt-1 border border-neutral-300 rounded-lg p-2"
          >
            <option value="overflowing">Overflowing</option>
            <option value="full">Full</option>
            <option value="mixed">Mixed waste</option>
          </select>

          <label className="block text-sm font-medium mt-3">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Kutte faila rahe hain…"
            className="w-full mt-1 border border-neutral-300 rounded-lg p-2"
          />

          <button
            onClick={submitFallback}
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-black text-white py-3 font-semibold disabled:opacity-50"
          >
            {submitting ? "Filing ticket…" : "File report"}
          </button>

          {ticket && (
            <p className="mt-3 text-sm font-semibold">
              ✓ Ticket #{ticket} filed. See it on the{" "}
              <Link href="/dashboard" className="underline">
                dashboard
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
