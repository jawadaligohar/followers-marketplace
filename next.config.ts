import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return ["instagram", "tiktok", "facebook", "twitter"].map(platform => ({ source: `/free-${platform}-likes`, destination: `/free/${platform}` }));
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
