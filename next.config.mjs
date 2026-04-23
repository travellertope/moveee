/** @type {import('next').NextConfig} */
import { readFileSync } from "fs";
const tempRedirects = JSON.parse(readFileSync("./redirects.json", "utf-8"));

const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'themoveee.com',
      },
      {
        protocol: 'https',
        hostname: 'cms.themoveee.com',
      },
      {
        protocol: 'https',
        hostname: 'secure.gravatar.com',
      },
      // Optimole CDN – uses dynamic per-site subdomains (e.g. mltvzlykp9yb.i.optimole.com)
      // Wildcard covers all current and future Optimole-assigned hostnames.
      {
        protocol: 'https',
        hostname: '**.i.optimole.com',
      },
      {
        protocol: 'https',
        hostname: '**.optimole.com',
      },
      {
        protocol: 'https',
        hostname: 'i2.wp.com',
      },
      {
        protocol: 'https',
        hostname: 'i0.wp.com',
      },
      {
        protocol: 'https',
        hostname: 'i1.wp.com',
      },
    ],
  },
  async redirects() {
    // Temporary redirects — edit redirects.json to add/remove, then redeploy.
    const temporary = tempRedirects.map(({ source, destination }) => ({
      source,
      destination,
      permanent: false, // 307 — browser won't cache these
    }));

    return [
      ...temporary,

      // ── Permanent structural redirects ──────────────────────────────────
      { source: '/cat/:slug*',        destination: '/magazine/category/:slug*', permanent: true },
      { source: '/tag/:slug*',        destination: '/magazine/tag/:slug*',      permanent: true },
      { source: '/series/:slug*',     destination: '/magazine/series/:slug*',   permanent: true },
      { source: '/industries/:slug*', destination: '/magazine/industry/:slug*', permanent: true },
      { source: '/countries/:slug*',  destination: '/magazine/country/:slug*',  permanent: true },
      { source: '/pcat/:slug*',       destination: '/shop/category/:slug*',     permanent: true },
      { source: '/brand/:slug*',      destination: '/shop/brand/:slug*',        permanent: true },
      { source: '/ptag/:slug*',       destination: '/shop/tag/:slug*',          permanent: true },
    ];
  },
};

export default nextConfig;
