import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/vitest-setup.ts'],
    include: ['tests/**/*.spec.ts'],
  },
});
