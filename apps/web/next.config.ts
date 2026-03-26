import type { NextConfig } from 'next';
import path from 'path';
import fs from 'fs';

function realPath(p: string): string {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return p;
  }
}

const root = realPath(path.resolve(__dirname, '../..'));

const nextConfig: NextConfig = {
  transpilePackages: [
    '@whoreagon-trail/game-engine',
    '@whoreagon-trail/characters',
    '@whoreagon-trail/ai-client',
  ],
  outputFileTracingRoot: root,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': realPath(
        path.resolve(__dirname, 'src/lib/asyncStorageStub.ts')
      ),
    };
    // Prevent webpack from resolving symlinks, letting Node handle real paths
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
