import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@han/ai", "@han/database", "@han/remotion", "@han/ui", "@han/voice"],
};

export default nextConfig;
