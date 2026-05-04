import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@gigaverse/ui', '@gigaverse/tokens'],
  staticPageGenerationTimeout: 300,
}

export default nextConfig
