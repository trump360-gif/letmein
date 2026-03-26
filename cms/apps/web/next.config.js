/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@letmein/ui', '@letmein/utils', '@letmein/types'],
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
  async redirects() {
    return [
      { source: '/community', destination: '/free', permanent: true },
      { source: '/community/:path*', destination: '/free/:path*', permanent: true },
    ]
  },
}

module.exports = nextConfig
