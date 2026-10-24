import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // BinBol is dynamic end-to-end (live scans/reports/route), so caching
  // components buys nothing here and conflicts with our route handlers.
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
