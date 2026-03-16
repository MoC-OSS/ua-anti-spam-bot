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

/**
 * @description ESLint plugin configuration for enforcing JSDoc comments and documentation standards in both JavaScript and TypeScript files, using separate presets for each language to ensure appropriate rules are applied. This config requires descriptions in JSDoc comments and extends recommended settings for both JS and TS.
 * @author Dmytro Vakulenko
 * @see https://github.com/gajus/eslint-plugin-jsdoc
 */
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
