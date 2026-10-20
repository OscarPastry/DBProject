import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't write an AGENTS.md into the repo on `next dev`
  agentRules: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
};

export default nextConfig;
