import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    AUTH_TRUST_HOST: "true",
    // AUTH_URL: process.env.AUTH_URL || "http://localhost:3000",
    AUTH_URL: process.env.AUTH_URL || "https://uproject.skiddie.id",
  },
  /* config options here */
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/auth/login",
        permanent: true,
      },
      {
        source: "/register",
        destination: "/auth/register",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
