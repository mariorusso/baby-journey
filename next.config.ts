import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-5b54d3df660c4f3e9ef3967621be3441.r2.dev', // Paste your R2 public hostname here
      },
    ],
  },
};

export default nextConfig;
