/**
 * Next.js Configuration (Fully Documented)
 *
 * This configuration uses Webpack instead of Turbopack because:
 * - You have custom Webpack chunk optimization logic
 * - Turbopack does NOT support these options yet
 * - Next.js 16 enables Turbopack by default, so we explicitly disable it
 *
 * This config is optimized for:
 * - Security
 * - API rewrites
 * - Image optimization
 * - Environment-based console removal
 * - Production-ready standalone output
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Disable Turbopack to avoid compatibility issues with custom Webpack config
   * Turbopack is Next.js’ default from v16+, but does not yet support:
   * - splitChunks
   * - custom cacheGroups
   * - advanced Webpack overrides
   */
  experimental: {
    // turbo: false, // Removed invalid key
  },

  /**
   * Enables React Strict Mode for additional runtime checks during dev.
   * Helps detect unsafe lifecycle methods and side effects early.
   */
  reactStrictMode: true,

  /**
   * Removes the "X-Powered-By: Next.js" header for better security.
   */
  poweredByHeader: false,

  /**
   * Ensures correct output tracing for monorepos or nested project structures.
   * Helps Next.js understand where dependencies exist on the filesystem.
   */
  outputFileTracingRoot: process.cwd(),

  /**
   * Improved image security and optimization configuration.
   *
   * Next.js 16 recommends using "remotePatterns" instead of "domains".
   * This prevents untrusted hosts from being used for image optimization.
   */
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "api.cointrack.app" },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60, // cache remote images for 60 seconds
  },

  /**
   * Adds secure HTTP response headers globally.
   *
   * These help prevent:
   * - Clickjacking (X-Frame-Options)
   * - MIME sniffing (X-Content-Type-Options)
   * - Leaking referrer data (Referrer-Policy)
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  /**
   * Custom Webpack configuration.
   *
   * This modifies Webpack’s chunk splitting in development mode
   * to create a "vendor" bundle that separates node_modules packages.
   *
   * Note: This entire block is why Turbopack must be disabled.
   */
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      if (!config.optimization.splitChunks) {
        config.optimization.splitChunks = {};
      }
      config.optimization.splitChunks.cacheGroups = {
        default: false,
        vendors: false,
        vendor: {
          name: "vendor",
          chunks: "all",
          test: /node_modules/,
        },
      };
    }
    return config;
  },

  /**
   * Standalone output mode:
   * - Produces a minimal server build
   * - Only includes files required to run the app
   * - Perfect for Docker & server deployments
   */
  output: "standalone",

  /**
   * Compiler-level optimizations.
   * Removes console.log statements in production builds to reduce logs & bundle size.
   */
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  /**
   * Redirects specific URLs for SEO or user experience improvements.
   */
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },

  /**
   * Rewrites allow the frontend to call backend APIs
   * without exposing the backend URL to the browser.
   *
   * For example:
   *   /api/users  →  http://localhost:8080/api/users
   *
   * Supports production via NEXT_PUBLIC_API_BASE environment variable.
   */
  async rewrites() {
    return [
      // API Proxy
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080"
          }/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
