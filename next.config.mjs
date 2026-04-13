/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicit rewrites so Vercel/platform routing never intercepts these
  // paths and incorrectly maps them to /magazine/[slug].
  async rewrites() {
    return [
      { source: '/quote',              destination: '/quote' },
      { source: '/quote/:path*',       destination: '/quote/:path*' },
      { source: '/directory',          destination: '/directory' },
      { source: '/directory/:path*',   destination: '/directory/:path*' },
    ];
  },
  images: {
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
      {
        protocol: 'https',
        hostname: 'mltvzlykp9yb.i.optimole.com',
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
};

export default nextConfig;
