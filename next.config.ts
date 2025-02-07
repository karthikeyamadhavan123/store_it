import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100MB"
    }
  },
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imgs.search.brave.com"
      },
      {
        protocol: "https",
        hostname: "cloud.appwrite.io"
      }
    ]
  }
};

export default nextConfig;
