import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'src': path.resolve(__dirname, 'src'),
      'tests': path.resolve(__dirname, 'tests'),
    },
  },
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
