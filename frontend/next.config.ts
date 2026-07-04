import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allows builds to complete despite eslint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allows builds to compile despite typescript warnings
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
