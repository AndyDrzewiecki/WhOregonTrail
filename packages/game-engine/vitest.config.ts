import path from 'path';

// Plain config object — avoids `vitest/config` import that requires local installation
export default {
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, 'src/__tests__/stubs/react.ts'),
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname,
        'src/__tests__/stubs/asyncStorage.ts'
      ),
    },
  },
};
