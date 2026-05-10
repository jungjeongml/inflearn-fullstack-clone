import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "300mb",
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.CLOUDFRONT_DOMAIN as string,
      }
    ]
  }
};

export default nextConfig;
