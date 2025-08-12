import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jmgalleries.com",
        port: "",
        pathname: "/view/__catalog/__thumbnail/**",
      },
    ],
  },
};

export default nextConfig;
