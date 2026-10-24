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

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setLoading(true);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || "image/jpeg",
          stationId: station.id,
          lang,
        }),
      });
      const data: ClassifyResponse = await res.json();
      if (!res.ok) throw new Error(data.error || "Classification failed");
      setResult(data);
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
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => setPlayingAudio(false);
      await audio.play();
    } catch {
      setPlayingAudio(false);
    }
  }

  return (
    <main className="flex-1 max-w-md mx-auto px-6 py-10 w-full">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← BinBol
      </Link>

      <div className="mt-4 rounded-2xl border-2 border-black p-5">
        <div className="text-xs uppercase tracking-wide opacity-60">
          {station.id} · {station.landmark}
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
            <div className="font-semibold">{result.item}</div>
            <div className="text-sm text-neutral-600 mt-1">{result.reason}</div>
            <div
              className={`stream-${result.stream} inline-block mt-3 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide`}
            >
              {result.stream} · {result.binColor}
            </div>
            <div className="mt-3 text-sm italic text-neutral-500">
              “{lang === "hi" ? result.spokenHindi : result.spokenEnglish}”
              {playingAudio && " 🔊"}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip the "data:image/...;base64," prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
