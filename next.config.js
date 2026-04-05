// 🚨 Error Tracking & Performance Monitoring
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 🔧 Phase 5: Performance Optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 📸 Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 480, 640, 800, 1024, 1280, 1536],
    imageSizes: [64, 96, 128, 160, 192, 224, 256, 320, 384, 448, 512],
    minimumCacheTTL: 2592000, // 30 days
  },

  // 📦 Code Splitting & Build Optimization
  productionBrowserSourceMaps: false, // Smaller bundle
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // ⚡ Performance Optimizations
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },

  // 🔄 Headers for Caching
  async headers() {
    return [
      {
        // Static assets (versioned by build)
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Images
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000',
          },
        ],
      },
      {
        // Fonts
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        // API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },

  // 🔗 Redirects & Rewrites  
  async redirects() {
    return [];
  },

  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
};

/**
 * Wrap Next.js config with Sentry
 * This enables:
 * - Server-side error tracking
 * - Performance monitoring
 * - Session replay (on supported plans)
 */
module.exports = withSentryConfig(
  nextConfig,
  {
    // Sentry build options
    org: process.env.SENTRY_ORG || '8-gigabytes',
    project: process.env.SENTRY_PROJECT || 'javascript-nextjs',
    
    // Automatically set release version
    authToken: process.env.SENTRY_AUTH_TOKEN,
    
    // Sentry CLI options
    sentry: {
      hideSourceMaps: true,
      tunnelRoute: '/monitoring',
      widenClientFileUpload: true,
      autoSessionTracking: true,
    },
  }
);
