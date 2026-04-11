import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@enspirit/predicate': path.resolve(__dirname, '../predicate/src/index.ts'),
      '@enspirit/bmg-js/async': path.resolve(__dirname, '../bmg/src/async.ts'),
      '@enspirit/bmg-js': path.resolve(__dirname, '../bmg/src/index.ts'),
      '@enspirit/bmg-sql': path.resolve(__dirname, '../bmg-sql/src/index.ts'),
      '@': path.resolve(__dirname, '../bmg/src'),
    },
  },
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
  },
});
