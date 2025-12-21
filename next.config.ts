import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore ALL TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Ignore ALL ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
    experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },

  // Optional but recommended for stability
  reactStrictMode: true,
};

export default nextConfig;
