/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  transpilePackages: ["@moveee/shared", "@moveee/utils"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'themoveee.com' },
      { protocol: 'https', hostname: 'cms.themoveee.com' },
      { protocol: 'https', hostname: 'secure.gravatar.com' },
      { protocol: 'https', hostname: '**.i.optimole.com' },
      { protocol: 'https', hostname: '**.optimole.com' },
      { protocol: 'https', hostname: 'i2.wp.com' },
      { protocol: 'https', hostname: 'i0.wp.com' },
      { protocol: 'https', hostname: 'i1.wp.com' },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
