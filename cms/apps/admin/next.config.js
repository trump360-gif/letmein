/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@letmein/ui', '@letmein/utils', '@letmein/types'],
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'bcryptjs'],
  },
}

module.exports = nextConfig
