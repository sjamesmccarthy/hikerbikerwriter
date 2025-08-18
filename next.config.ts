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
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
