/** @type {import('next').NextConfig} */
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
  async redirects() {
    return [
      {
        source: '/cat/:slug*',
        destination: '/magazine/category/:slug*',
        permanent: true,
      },
      {
        source: '/tag/:slug*',
        destination: '/magazine/tag/:slug*',
        permanent: true,
      },
      {
        source: '/series/:slug*',
        destination: '/magazine/series/:slug*',
        permanent: true,
      },
      {
        source: '/industries/:slug*',
        destination: '/magazine/industry/:slug*',
        permanent: true,
      },
      {
        source: '/countries/:slug*',
        destination: '/magazine/country/:slug*',
        permanent: true,
      },
      {
        source: '/pcat/:slug*',
        destination: '/shop/category/:slug*',
        permanent: true,
      },
      {
        source: '/brand/:slug*',
        destination: '/shop/brand/:slug*',
        permanent: true,
      },
      {
        source: '/ptag/:slug*',
        destination: '/shop/tag/:slug*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
