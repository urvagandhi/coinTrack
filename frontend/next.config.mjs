/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add proxy configuration for API calls
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/:path*',
      },
    ];
  },
};

export default nextConfig;
