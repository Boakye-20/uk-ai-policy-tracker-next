/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'aipolicy.local',
          },
        ],
        destination: '/:path*',
      },
    ]
  },
  // For development with custom domain
  experimental: {
    serverActions: {
      allowedOrigins: ['aipolicy.local:3000', 'localhost:3000']
    }
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
}

module.exports = nextConfig
