import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // BinBol is dynamic end-to-end (live scans/reports/route), so caching
  // components buys nothing here and conflicts with our route handlers.
  // Scanning now happens only in Recycle Buddy, and bins no longer carry QR
  // codes; keep old links working instead of 404ing.
  async redirects() {
    return [
      { source: "/scan", destination: "/buddy", permanent: false },
      { source: "/scan/:id", destination: "/buddy", permanent: false },
      { source: "/qr", destination: "/stations", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
