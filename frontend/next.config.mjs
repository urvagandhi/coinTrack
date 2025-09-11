/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add proxy configuration for API calls
  async rewrites() {
      return [
      {
        source: '/api/:path*',
        // Remove the /api prefix when proxying to backend since Spring Boot endpoints don't have /api prefix
        destination: 'http://localhost:8080/:path*',
      },
    ];
  },
};

export default nextConfig;
