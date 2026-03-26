import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@whoreagon-trail/game-engine',
    '@whoreagon-trail/characters',
    '@whoreagon-trail/ai-client',
  ],
};

export default nextConfig;
