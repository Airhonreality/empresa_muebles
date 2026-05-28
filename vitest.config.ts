import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'packages/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@agnostic/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
