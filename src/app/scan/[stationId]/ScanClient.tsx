"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Station } from "@/lib/stations";

interface ClassifyResponse {
  item: string;
  stream: "wet" | "dry" | "hazardous" | "sanitary";
  binColor: string;
  reason: string;
  confidence: number;
  spokenHindi: string;
  spokenEnglish: string;
  error?: string;
}

export default function ScanClient({ station }: { station: Station }) {
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
          stationId: station.id,
          lang,
        }),
      });
      // Vercel's own errors (e.g. 413 payload too large) come back as plain
      // text, so read text first instead of trusting res.json() — otherwise
      // Safari surfaces a cryptic "string did not match the expected pattern".
      const raw = await res.text();
      let data: ClassifyResponse;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          res.status === 413
            ? "Photo too large — please try again."
            : `Server error (${res.status}). Please try again.`
        );
      }
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
            {station.id} · {station.landmark}
          </div>
          {scanCount > 0 && (
            <div className="text-xs rounded-full bg-neutral-100 border border-neutral-300 px-2 py-0.5 text-neutral-500">
              {scanCount} scan{scanCount === 1 ? "" : "s"} this session
            </div>
          )}
        </div>
        <h1 className="text-2xl font-black mt-1">Scan &amp; Speak</h1>

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

// Phone camera photos are 3–8 MB, which blows past Vercel's ~4.5 MB request
// body limit once base64-encoded. Downscale to a max of 1024px on the long
// edge and re-encode as JPEG (~100–200 KB) — plenty for classification, and
// it also normalises HEIC/PNG uploads into a format the model accepts.
const MAX_EDGE = 1024;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process the photo."));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      // strip the "data:image/jpeg;base64," prefix
      resolve(canvas.toDataURL("image/jpeg", 0.82).split(",")[1]);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that photo — try taking it again."));
    };
    img.src = url;
  });
}
