"use client";

import { useRef, useState } from "react";
import { compressImage, readJson } from "@/lib/image";

interface RecycleResult {
  item: string;
  stream: "wet" | "dry" | "hazardous" | "sanitary";
  binColor: string;
  reason: string;
  recyclable: boolean;
  recycleSteps: string[];
  error?: string;
}

type Msg =
  | { role: "user"; text: string; photo?: string }
  | { role: "bot"; text: string; recycle?: RecycleResult };

// Floating BinBol helper, bottom-right on every page: a camera button that
// answers "can I recycle this — and how?", plus free-text questions. Answers
// can be played aloud through ElevenLabs.
export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text: "Namaste! I'm your Recycle Buddy ♻ Snap any item and I'll tell you if it can be recycled — and how.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  function push(m: Msg) {
    setMsgs((prev) => [...prev, m]);
    requestAnimationFrame(() =>
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
    );
  }

  async function onPhoto(file: File) {
    push({ role: "user", text: "Can I recycle this?", photo: URL.createObjectURL(file) });
    setBusy(true);
    try {
      const imageBase64 = await compressImage(file);
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: "image/jpeg" }),
      });
      const data = await readJson<RecycleResult>(res);
      if (!res.ok) throw new Error(data.error || "Couldn't check that one.");
      const verdict = data.recyclable
        ? `Yes — ${data.item} can be recycled.`
        : `${data.item} can't really be recycled.`;
      push({ role: "bot", text: `${verdict} It goes in the ${data.binColor.toLowerCase()}.`, recycle: data });
    } catch (e) {
      push({ role: "bot", text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  async function onAsk(preset?: string) {
    const q = (preset ?? input).trim();
    if (!q || busy) return;
    setInput("");
    push({ role: "user", text: q });
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await readJson<{ answer?: string; error?: string }>(res);
      if (!res.ok || !data.answer) throw new Error(data.error || "No answer.");
      push({ role: "bot", text: data.answer });
    } catch (e) {
      push({ role: "bot", text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  async function speak(i: number, m: Msg) {
    if (speaking !== null) return;
    const steps = m.role === "bot" && m.recycle?.recycleSteps?.length ? " " + m.recycle.recycleSteps.join(". ") : "";
    setSpeaking(i);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: m.text + steps }),
      });
      if (!res.ok) throw new Error();
      const audio = new Audio(URL.createObjectURL(await res.blob()));
      audio.onended = () => setSpeaking(null);
      await audio.play();
    } catch {
      setSpeaking(null);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed z-50 bottom-24 right-3 sm:right-5 w-[calc(100vw-1.5rem)] max-w-sm h-[min(70vh,540px)] flex flex-col rounded-3xl border-2 border-black bg-white shadow-[0_24px_48px_-16px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-black">
            <BotFace small />
            <div className="flex-1">
              <div className="font-black leading-none">Recycle Buddy</div>
              <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e7a46]" /> Online · हिंदी / English
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-xl leading-none px-2">
              ×
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-black text-white px-3 py-2 text-sm">
                    {m.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photo} alt="" className="rounded-lg mb-1.5 max-h-36 object-cover" />
                    )}
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm border-2 border-black px-3 py-2 text-sm">
                    {m.recycle && (
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="font-black">{m.recycle.recyclable ? "♻ Recyclable" : "✕ Not recyclable"}</span>
                        <span className={`stream-${m.recycle.stream} text-[10px] font-bold uppercase px-2 py-0.5 rounded-full`}>
                          {m.recycle.stream}
                        </span>
                      </div>
                    )}
                    <div>{m.text}</div>
                    {m.recycle && m.recycle.recycleSteps.length > 0 && (
                      <ol className="mt-1.5 list-decimal pl-5 text-neutral-600 space-y-0.5">
                        {m.recycle.recycleSteps.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ol>
                    )}
                    {i > 0 && (
                      <button
                        onClick={() => speak(i, m)}
                        className="mt-1.5 text-xs underline text-neutral-500 hover:text-black"
                      >
                        {speaking === i ? "Speaking…" : "🔊 Listen"}
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
            {msgs.length === 1 && !busy && (
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-2xl bg-black text-white px-4 py-3 text-left flex items-center gap-3 card-lift"
                >
                  <span className="text-xl">📷</span>
                  <span>
                    <span className="block font-bold text-sm">Snap an item</span>
                    <span className="block text-xs opacity-70">Recyclable? Which bin? How?</span>
                  </span>
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {["Chips packet recyclable?", "Purani battery kahan daalun?", "Pizza box?"].map((q) => (
                    <button
                      key={q}
                      onClick={() => onAsk(q)}
                      className="text-xs rounded-full border-2 border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {busy && (
              <div className="flex">
                <div className="rounded-2xl border-2 border-black px-3 py-2 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-bounce [animation-delay:120ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-bounce [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t-2 border-black p-3 flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPhoto(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              aria-label="Check an item with the camera"
              className="shrink-0 w-11 h-11 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-40"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onAsk()}
              placeholder="Ask about any waste…"
              className="flex-1 min-w-0 rounded-full border-2 border-black px-4 py-2 text-sm outline-none"
            />
            <button
              onClick={() => onAsk()}
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="shrink-0 w-11 h-11 rounded-full border-2 border-black flex items-center justify-center disabled:opacity-30"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Recycle Buddy" : "Open Recycle Buddy"}
        className="fixed z-50 bottom-3 right-3 sm:bottom-5 sm:right-5 group flex flex-col items-center"
      >
        <span className="block transition-transform group-hover:-translate-y-1 group-active:scale-95">
          {open ? <CloseFace /> : <BotFace />}
        </span>
        {!open && (
          <span className="buddy-pop -mt-2 rounded-full bg-white border-2 border-black px-2 py-0.5 text-[10px] font-bold leading-none whitespace-nowrap shadow-sm">
            ♻ Recycle Buddy
          </span>
        )}
      </button>
    </>
  );
}

function CloseFace() {
  return (
    <svg width={56} height={56} viewBox="0 0 64 64" className="drop-shadow-[0_8px_12px_rgba(0,0,0,0.3)]">
      <circle cx="32" cy="32" r="31" fill="#0a0a0a" />
      <path d="M24 24 L40 40 M40 24 L24 40" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// A little smiling bin as the assistant's face.
function BotFace({ small = false }: { small?: boolean }) {
  const s = small ? 36 : 56;
  return (
    <svg width={s} height={s} viewBox="0 0 64 64" className={small ? "" : "drop-shadow-[0_8px_12px_rgba(0,0,0,0.3)]"}>
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
