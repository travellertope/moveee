/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ],
  },
};

export default nextConfig;
