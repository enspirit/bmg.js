import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'src': path.resolve(__dirname, 'src'),
      'tests': path.resolve(__dirname, 'tests'),
      '@enspirit/predicate': path.resolve(__dirname, '../predicate/src/index.ts'),
    },
  },
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
