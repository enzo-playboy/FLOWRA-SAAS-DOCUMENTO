/** @type {import('next').NextConfig} */
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

const nextConfig = {
  reactStrictMode: true,
  // Backend-only (API routes). Sem export estático.

  // CORS: libera só a origem do frontend (evita wildcard).
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: FRONTEND_URL },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
