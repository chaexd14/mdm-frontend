import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/kiosks/:path*",
        destination: "/api/kiosks/:path*",
      },
      {
        source: "/api/kiosks/v1/:deviceId/commands",
        destination: "/api/kiosks/:deviceId/commands",
      },
    ];
  },
};

export default nextConfig;
