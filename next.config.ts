import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't use standalone on Vercel — Vercel handles deployment natively.
  // Standalone is only needed for self-hosted Docker / VPS deploys.
  // output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
