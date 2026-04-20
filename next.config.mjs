/** @type {import('next').NextConfig} */

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

const nextConfig = {
  output: 'standalone',

  // Proxy /api/* and /sanctum/* through Next.js so that cookies are always
  // set for the same origin as the frontend (avoids cross-port cookie issues
  // with Laravel Sanctum SPA auth in development).
  async rewrites() {
    return [
      {
        source: '/sanctum/:path*',
        destination: `${API_ORIGIN}/sanctum/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control',     value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
