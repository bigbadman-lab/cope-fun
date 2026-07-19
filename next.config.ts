import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Legacy $COPE token page → canonical $SWARM token page.
        source: "/cope",
        destination: "/swarm",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
