/** @type {import('next').NextConfig} */
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tempRedirects = JSON.parse(readFileSync("./redirects.json", "utf-8"));

const nextConfig = {
  transpilePackages: ["@moveee/shared", "@moveee/utils"],
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    // NOTE: unoptimized=true delegates optimisation to the Optimole CDN.
    // As a side-effect, Next.js remotePatterns allowlist is NOT enforced —
    // any domain can be loaded via <Image>. Dynamic image src values must
    // be validated at the component level. See security-audit finding #27.
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
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://cms.themoveee.com https://connect.themoveee.com https://www.google-analytics.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self';" },
        ],
      },
    ];
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

      // ── Services old slug redirects (now market-based pages) ────────────
      { source: '/services/amplify',         destination: '/services', permanent: false },
      { source: '/services/presskit',        destination: '/services', permanent: false },
      { source: '/services/book-publishers', destination: '/services', permanent: false },

      // ── Permanent structural redirects ──────────────────────────────────
      { source: '/origins',             destination: '/journeys',                 permanent: true },
      { source: '/origins/:slug*',      destination: '/journeys/:slug*',          permanent: true },
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
