import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cbt-be-production.up.railway.app",
        port: "",
        pathname: "/api/v1/utility/uploads/**",
      },
    ],
  },
};

export default nextConfig;
