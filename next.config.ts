import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // WebRTC requires headers for cross-origin isolation in some scenarios
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=*, microphone=*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
