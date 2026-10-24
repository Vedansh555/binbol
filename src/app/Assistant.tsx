"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Floating entry point to the full-page Recycle Buddy, shown on every page
// except the Buddy page itself.
export default function Assistant() {
  const pathname = usePathname();
  if (pathname === "/buddy") return null;

  return (
    <Link
      href="/buddy"
      aria-label="Open Recycle Buddy"
      className="buddy-pop fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6 group flex items-center gap-2.5 rounded-full bg-black text-white pl-1.5 pr-5 py-1.5 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.55)] ring-1 ring-black/10 hover:-translate-y-0.5 active:scale-95 transition-transform"
    >
      <span className="relative">
        <BotFace />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#2ecc71] ring-2 ring-black" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-black">Recycle Buddy</span>
        <span className="block text-[11px] text-white/60">Can I recycle this?</span>
      </span>
    </Link>
  );
}

// A little smiling bin as Buddy's face.
function BotFace() {
  return (
    <svg width="42" height="42" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="#fff" />
      <rect x="18" y="20" width="28" height="30" rx="4" fill="#0a0a0a" />
      <rect x="15" y="15" width="34" height="6" rx="3" fill="#0a0a0a" />
      <rect x="28" y="11" width="8" height="4" rx="2" fill="#0a0a0a" />
      <circle cx="26" cy="32" r="2.6" fill="#fff">
        <animate attributeName="r" values="2.6;2.6;0.4;2.6" keyTimes="0;0.92;0.96;1" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="38" cy="32" r="2.6" fill="#fff">
        <animate attributeName="r" values="2.6;2.6;0.4;2.6" keyTimes="0;0.92;0.96;1" dur="4s" repeatCount="indefinite" />
      </circle>
      <path d="M26 39 q6 5 12 0" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="21.5" cy="37" r="2" fill="#f4a4a4" />
      <circle cx="42.5" cy="37" r="2" fill="#f4a4a4" />
    </svg>
  );
}
