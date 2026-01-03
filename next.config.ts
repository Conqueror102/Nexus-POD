import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

// Loader path from orchids-visual-edits - use direct resolve to get the actual file
const loaderPath = require.resolve('orchids-visual-edits/loader.js');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(jsx|tsx)$/,
      use: [
        {
          loader: loaderPath,
        },
      ],
    });
    return config;
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Enable PWA in development mode for offline testing
  // Set DISABLE_PWA=true to disable it
  disable: process.env.DISABLE_PWA === "true",
  fallbacks: {
    document: "/offline",
  },
  // Build exclude patterns to avoid caching issues
  buildExcludes: [/middleware-manifest\.json$/],
});

export default pwaConfig(nextConfig);
