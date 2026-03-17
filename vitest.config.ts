import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: [{ find: /^buffer\/$/, replacement: 'buffer' }],
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/vitest-setup.ts'],
    include: ['tests/**/*.spec.ts'],
    server: {
      deps: {
        inline: ['nsfwjs'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      exclude: ['node_modules/', 'dist/', '**/*.spec.ts', '**/*.test.ts', '**/*.interface.ts', '**/*.dto.ts', '**/*.entity.ts'],
    },
  },
});
