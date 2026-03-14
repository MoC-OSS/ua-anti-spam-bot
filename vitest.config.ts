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
  },
});
