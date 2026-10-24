"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Station } from "@/lib/stations";
import { compressImage, readJson } from "@/lib/image";

interface ClassifyResponse {
  item: string;
  stream: "wet" | "dry" | "hazardous" | "sanitary";
  binColor: string;
  reason: string;
  confidence: number;
  recyclable: boolean;
  recycleSteps: string[];
  spokenHindi: string;
  spokenEnglish: string;
  error?: string;
}

// station is optional: /scan is a plain product scan, /scan/<id> also logs
// the scan against that bin station for the dashboard.
export default function ScanClient({ station }: { station?: Station }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassifyResponse | null>(null);
  const [lang, setLang] = useState<"hi" | "en">("hi");
  const [error, setError] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [lastAudioBlob, setLastAudioBlob] = useState<Blob | null>(null);

  const LOW_CONFIDENCE = 0.55;

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setLoading(true);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const base64 = await compressImage(file);
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: "image/jpeg",
          stationId: station?.id,
          lang,
        }),
      });
      const data = await readJson<ClassifyResponse>(res);
      if (!res.ok) throw new Error(data.error || "Classification failed");
      setResult(data);
      setScanCount((n) => n + 1);
      await playSpoken(data, lang);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function playSpoken(data: ClassifyResponse, l: "hi" | "en") {
    try {
      setPlayingAudio(true);
      const text = l === "hi" ? data.spokenHindi : data.spokenEnglish;
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      setLastAudioBlob(blob);
      await playBlob(blob);
    } catch {
      setPlayingAudio(false);
    }
  }

  async function playBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    setPlayingAudio(true);
    audio.onended = () => setPlayingAudio(false);
    await audio.play();
  }

  return (
    <main className="flex-1 max-w-md mx-auto px-6 py-10 w-full">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← BinBol
      </Link>

      <div className="mt-4 rounded-2xl border-2 border-black p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide opacity-60">
            {station ? `${station.id} · ${station.landmark}` : "Any item · anywhere"}
          </div>
          {scanCount > 0 && (
            <div className="text-xs rounded-full bg-neutral-100 border border-neutral-300 px-2 py-0.5 text-neutral-500">
              {scanCount} scan{scanCount === 1 ? "" : "s"} this session
            </div>
          )}
        </div>
        <h1 className="text-2xl font-black mt-1">Scan an item</h1>

        <div className="mt-4 aspect-square w-full rounded-xl bg-neutral-100 border border-neutral-300 overflow-hidden flex items-center justify-center">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Captured item" className="w-full h-full object-cover" />
          ) : (
            <span className="text-neutral-400 text-sm">No photo yet</span>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-black text-white py-3 font-semibold disabled:opacity-50"
        >
          {loading ? "Thinking…" : preview ? "Scan next item" : "Open camera"}
        </button>

        <div className="mt-2 flex justify-center gap-2 text-sm">
          <button
            onClick={() => setLang("hi")}
            className={`px-3 py-1 rounded-full border ${lang === "hi" ? "bg-black text-white" : "border-neutral-300"}`}
          >
            हिंदी
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1 rounded-full border ${lang === "en" ? "bg-black text-white" : "border-neutral-300"}`}
          >
            English
          </button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        {result && (
          <div className="mt-5 rounded-xl border border-neutral-300 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold">{result.item}</div>
              <span
                className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-mono ${
                  result.confidence < LOW_CONFIDENCE
                    ? "border-2 border-dashed border-black font-bold"
                    : "bg-neutral-100 text-neutral-500"
                }`}
                title="Model confidence"
              >
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
            <div className="text-sm text-neutral-600 mt-1">{result.reason}</div>
            <div
              className={`stream-${result.stream} inline-block mt-3 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide`}
            >
              {result.stream} · {result.binColor}
            </div>

            <div className="mt-3 text-sm">
              <span className="font-bold">
                {result.recyclable ? "♻ Recyclable" : "✕ Not recyclable"}
              </span>
              {result.recycleSteps?.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-neutral-600">
                  {result.recycleSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              )}
            </div>

            {result.confidence < LOW_CONFIDENCE && (
              <div className="mt-3 text-sm rounded-lg border-2 border-dashed border-black px-3 py-2">
                <span className="font-bold">⚠ Not fully sure</span> — a
                closer, well-lit photo of just the item will usually fix it.
                Worth a re-scan before you bin it.
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 text-sm italic text-neutral-500">
              <span>
                “{lang === "hi" ? result.spokenHindi : result.spokenEnglish}”
              </span>
              {lastAudioBlob && (
                <button
                  onClick={() => playBlob(lastAudioBlob)}
                  disabled={playingAudio}
                  className="shrink-0 not-italic rounded-full border border-neutral-300 w-7 h-7 flex items-center justify-center hover:border-black disabled:opacity-40"
                  aria-label="Replay"
                  title="Replay"
                >
                  {playingAudio ? "…" : "🔊"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
