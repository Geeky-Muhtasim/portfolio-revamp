import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  // Do not let `next dev` write AGENTS.md / CLAUDE.md into the repo.
  agentRules: false,
};

export default nextConfig;
