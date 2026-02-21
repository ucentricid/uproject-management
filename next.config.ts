import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    AUTH_TRUST_HOST: "true",
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
