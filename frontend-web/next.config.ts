import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In production the Railway backend URL is injected at build time via
  // NEXT_PUBLIC_API_URL. During local dev it falls back to localhost:3001.
  // We also expose a server-side rewrite so /api/* proxies to the backend
  // without leaking the raw Railway URL in browser network tabs.
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
