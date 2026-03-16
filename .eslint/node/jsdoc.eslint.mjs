import { defineConfig } from 'eslint/config';
import { jsdoc } from 'eslint-plugin-jsdoc';

const typescriptFiles = ['**/*.{ts,tsx,mts,cts}'];
const javascriptFiles = ['**/*.{js,jsx,mjs,cjs}'];

const typescriptPreset = jsdoc({
  config: 'flat/recommended-typescript-error',
});

const javascriptPreset = jsdoc({
  config: 'flat/recommended-error',
});

export default defineConfig([
  {
    ...typescriptPreset,
    files: typescriptFiles,
    rules: {
      ...typescriptPreset.rules,
      'jsdoc/require-description': 'error',
    },
  },
  {
    ...javascriptPreset,
    files: javascriptFiles,
    rules: {
      ...javascriptPreset.rules,
      'jsdoc/require-description': 'error',
    },
  },
]);
