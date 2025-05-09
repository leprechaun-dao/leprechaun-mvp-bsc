import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false };

    return config;
  },
  transpilePackages: ["@uniswap/widgets", "@uniswap/conedison", "brotli"],
};

export default nextConfig;
