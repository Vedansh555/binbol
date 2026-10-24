import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Assistant from "./Assistant";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BinBol — Give campus waste a voice",
  description:
    "A voice + camera layer that helps a campus segregate, collect and report its waste.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* bottom padding keeps page content clear of the floating Recycle Buddy */}
      <body className="min-h-full flex flex-col bg-white text-black pb-24">
        {children}
        <Assistant />
      </body>
    </html>
  );
}
