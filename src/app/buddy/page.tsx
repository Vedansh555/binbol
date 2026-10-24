"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { compressImage, readJson } from "@/lib/image";

interface Result {
  item: string;
  stream: "wet" | "dry" | "hazardous" | "sanitary";
  binColor: string;
  reason: string;
  confidence: number;
  recyclable: boolean;
  recycleSteps: string[];
  scrapValue: string;
  error?: string;
}

interface Chat {
  role: "user" | "bot";
  text: string;
}

const QUICK = ["Chips packet recyclable?", "Purani battery kahan daalun?", "Pizza box?", "Kya thermocol recycle hota hai?"];

// Recycle Buddy: a full-screen camera-first helper. Live viewfinder ->
// shutter -> verdict card (recyclable?, which bin, how, scrap value), with
// ElevenLabs read-aloud and a chat for follow-up questions.
export default function BuddyPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camState, setCamState] = useState<"starting" | "live" | "unavailable">("starting");
  const [snap, setSnap] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [checked, setChecked] = useState(0);
  const [recyclableCount, setRecyclableCount] = useState(0);
  const [chat, setChat] = useState<Chat[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCamState("live");
      } catch {
        if (!cancelled) setCamState("unavailable");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function classify(imageBase64: string, previewUrl: string) {
    setSnap(previewUrl);
    setResult(null);
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: "image/jpeg" }),
      });
      const data = await readJson<Result>(res);
      if (!res.ok) throw new Error(data.error || "Couldn't check that one.");
      setResult(data);
      setChecked((n) => n + 1);
      if (data.recyclable) setRecyclableCount((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function shoot() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const scale = Math.min(1, 1024 / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg", 0.82);
    classify(dataUrl.split(",")[1], dataUrl);
  }

  async function onFile(file: File) {
    try {
      const b64 = await compressImage(file);
      classify(b64, `data:image/jpeg;base64,${b64}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that photo.");
    }
  }

  async function speak(text: string) {
    if (speaking) return;
    setSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      const audio = new Audio(URL.createObjectURL(await res.blob()));
      audio.onended = () => setSpeaking(false);
      await audio.play();
    } catch {
      setSpeaking(false);
    }
  }

  async function ask(preset?: string) {
    const q = (preset ?? input).trim();
    if (!q || asking) return;
    setInput("");
    setChat((c) => [...c, { role: "user", text: q }]);
    setAsking(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await readJson<{ answer?: string; error?: string }>(res);
      if (!res.ok || !data.answer) throw new Error(data.error || "No answer.");
      setChat((c) => [...c, { role: "bot", text: data.answer! }]);
    } catch (e) {
      setChat((c) => [...c, { role: "bot", text: e instanceof Error ? e.message : "Something went wrong." }]);
    } finally {
      setAsking(false);
    }
  }

  const verdictText = result
    ? `${result.recyclable ? "Haan, ye recycle ho sakta hai." : "Ye recycle nahi hota."} ${result.item}. ${result.binColor}. ${result.recycleSteps.join(". ")}`
    : "";

  return (
    <main className="flex-1 w-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-neutral-500 hover:underline">
            ← BinBol
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border-2 border-black px-3 py-1 font-semibold">
              {checked} checked
            </span>
            <span className="rounded-full bg-black text-white px-3 py-1 font-semibold">
              ♻ {recyclableCount} recyclable
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <BuddyFace />
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none">Recycle Buddy</h1>
            <p className="text-neutral-600 mt-1 text-sm sm:text-base">
              Point at any item. Recyclable? Which bin? How — and is it worth money?
            </p>
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-[1.1fr_1fr] gap-6 items-start">
          {/* camera */}
          <section>
            <div className="relative aspect-[4/5] sm:aspect-[4/3] w-full rounded-3xl overflow-hidden bg-neutral-900 border-2 border-black">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${snap ? "opacity-0" : ""}`}
              />
              {snap && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={snap} alt="Captured item" className="absolute inset-0 w-full h-full object-cover" />
              )}

              {/* viewfinder corners */}
              <div className="pointer-events-none absolute inset-6 sm:inset-10">
                {["top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl", "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl"].map((c) => (
                  <span key={c} className={`absolute w-10 h-10 border-white ${c}`} />
                ))}
                {(busy || (!snap && camState === "live")) && (
                  <span className={`scan-line absolute left-0 right-0 h-0.5 bg-white/90 shadow-[0_0_16px_4px_rgba(255,255,255,0.6)] ${busy ? "fast" : ""}`} />
                )}
              </div>

              {camState === "starting" && !snap && (
                <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">Starting camera…</div>
              )}
              {camState === "unavailable" && !snap && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white text-center px-8">
                  <span className="text-4xl">📷</span>
                  <span className="text-sm text-white/80">Camera not available here — upload a photo instead.</span>
                </div>
              )}
              {busy && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white text-black text-sm font-bold px-4 py-1.5">
                  Checking…
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />

            <div className="mt-4 flex items-center justify-center gap-6">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center text-lg hover:bg-black hover:text-white transition-colors"
                aria-label="Upload a photo"
                title="Upload a photo"
              >
                🖼
              </button>
              {snap ? (
                <button
                  onClick={() => {
                    setSnap(null);
                    setResult(null);
                    setError(null);
                  }}
                  disabled={busy}
                  className="h-16 px-8 rounded-full bg-black text-white font-bold disabled:opacity-50 card-lift"
                >
                  Scan another
                </button>
              ) : (
                <button
                  onClick={camState === "live" ? shoot : () => fileRef.current?.click()}
                  disabled={busy}
                  aria-label="Take photo"
                  className="w-[72px] h-[72px] rounded-full bg-white border-[5px] border-black flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                >
                  <span className="w-[52px] h-[52px] rounded-full bg-black" />
                </button>
              )}
              <span className="w-12" />
            </div>
          </section>

          {/* result + chat */}
          <section className="space-y-5">
            {error && (
              <div className="rounded-2xl border-2 border-dashed border-black p-4 text-sm">
                <b>⚠</b> {error}
              </div>
            )}

            {!result && !error && (
              <div className="rounded-3xl border-2 border-black p-6">
                <div className="text-xs uppercase tracking-wide text-neutral-500">How it works</div>
                <ol className="mt-3 space-y-3">
                  {[
                    ["📷", "Point at the item", "Chai cup, chips packet, battery — anything."],
                    ["♻", "Get a verdict", "Recyclable or not, and which bin."],
                    ["💰", "Know its value", "What a kabadiwala pays for it."],
                  ].map(([icon, t, d]) => (
                    <li key={t} className="flex gap-3">
                      <span className="w-9 h-9 shrink-0 rounded-full bg-black text-white flex items-center justify-center">{icon}</span>
                      <span>
                        <span className="block font-bold">{t}</span>
                        <span className="block text-sm text-neutral-500">{d}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {result && (
              <div className="result-in rounded-3xl border-2 border-black overflow-hidden">
                <div className={`px-6 py-5 ${result.recyclable ? "bg-black text-white" : "bg-white"}`}>
                  <div className="text-xs uppercase tracking-widest opacity-70">Verdict</div>
                  <div className="text-3xl font-black mt-1">
                    {result.recyclable ? "♻ Recyclable" : "✕ Not recyclable"}
                  </div>
                  <div className="mt-1 opacity-80">{result.item}</div>
                </div>
                <div className="px-6 py-5 space-y-4 border-t-2 border-black">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`stream-${result.stream} px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide`}>
                      {result.stream} · {result.binColor}
                    </span>
                    {result.scrapValue && (
                      <span className="px-3 py-1 rounded-full border-2 border-black text-sm font-bold">
                        💰 {result.scrapValue}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600">{result.reason}</p>
                  {result.recycleSteps.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">How to recycle</div>
                      <ol className="space-y-2">
                        {result.recycleSteps.map((s, i) => (
                          <li key={s} className="flex gap-3 text-sm">
                            <span className="w-6 h-6 shrink-0 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold">
                              {i + 1}
                            </span>
                            <span className="pt-0.5">{s}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  <button
                    onClick={() => speak(verdictText)}
                    disabled={speaking}
                    className="w-full rounded-full border-2 border-black py-2.5 text-sm font-bold hover:bg-black hover:text-white transition-colors disabled:opacity-60"
                  >
                    {speaking ? "🔊 Speaking…" : "🔊 Hear it in Hindi"}
                  </button>
                </div>
              </div>
            )}

            {/* chat */}
            <div className="rounded-3xl border-2 border-black p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500 px-1">Ask Buddy anything</div>
              {chat.length > 0 && (
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                  {chat.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          m.role === "user" ? "bg-black text-white rounded-br-sm" : "border-2 border-black rounded-bl-sm"
                        }`}
                      >
                        {m.text}
                        {m.role === "bot" && (
                          <button onClick={() => speak(m.text)} className="block mt-1 text-xs underline text-neutral-500">
                            🔊 Listen
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {asking && <div className="text-sm text-neutral-500 px-1">Buddy is typing…</div>}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    className="text-xs rounded-full border-2 border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && ask()}
                  placeholder="Type in Hindi or English…"
                  className="flex-1 min-w-0 rounded-full border-2 border-black px-4 py-2 text-sm outline-none"
                />
                <button
                  onClick={() => ask()}
                  disabled={asking || !input.trim()}
                  className="rounded-full bg-black text-white px-5 text-sm font-bold disabled:opacity-30"
                >
                  Ask
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function BuddyFace() {
  return (
    <svg width="56" height="56" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r="31" fill="#0a0a0a" />
      <rect x="18" y="20" width="28" height="30" rx="4" fill="#fff" />
      <rect x="15" y="15" width="34" height="6" rx="3" fill="#fff" />
      <rect x="28" y="11" width="8" height="4" rx="2" fill="#fff" />
      <circle cx="26" cy="32" r="2.6" fill="#0a0a0a">
        <animate attributeName="r" values="2.6;2.6;0.4;2.6" keyTimes="0;0.92;0.96;1" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="38" cy="32" r="2.6" fill="#0a0a0a">
        <animate attributeName="r" values="2.6;2.6;0.4;2.6" keyTimes="0;0.92;0.96;1" dur="4s" repeatCount="indefinite" />
      </circle>
      <path d="M26 39 q6 5 12 0" stroke="#0a0a0a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="21.5" cy="37" r="2" fill="#f4a4a4" />
      <circle cx="42.5" cy="37" r="2" fill="#f4a4a4" />
    </svg>
  );
}
