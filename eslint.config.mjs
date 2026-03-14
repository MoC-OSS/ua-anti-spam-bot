import { defineConfig } from 'eslint/config';

import nodeConfigs from './.eslint/node.eslint.mjs';
import vitestEslint from './.eslint/vitest.eslint.mjs';

export default defineConfig([
  // Apply this config to js and ts files only
  {
    name: 'Source Files to scan',
    files: ['**/*.{js,mjs,cjs,ts}'],
  },
  // Node config
  ...nodeConfigs,
  // Vitest rules for testing
  ...vitestEslint,
]);
