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
};

export default nextConfig;
