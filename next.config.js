/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Webpack configuration for compatibility
    webpack: (config) => {
        config.resolve.fallback = { fs: false };
        return config;
    },

    // Custom rewrites
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

    // Experimental features
    experimental: {
        // Server actions configuration
        serverActions: {
            allowedOrigins: ['aipolicy.local:3000', 'localhost:3000', 'localhost:3001']
        },
        // Turbopack configuration
        turbo: {
            rules: {}
        },
        // Turbotrace configuration for better debugging
        turbotrace: {
            contextDirectory: __dirname
        }
    }
}

module.exports = nextConfig
