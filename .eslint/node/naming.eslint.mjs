import { defineConfig } from 'eslint/config';
import namingConfig from 'eslint-config-naming';
import tseslint from 'typescript-eslint';

/**
 * @description ESLint config for naming conventions using eslint-config-naming. Enforces consistent naming styles for variables, functions, classes, and other identifiers in TypeScript projects.
 * @author Dmytro Vakulenko
 * @see https://github.com/DrSmile444/eslint-config-naming
 */
export default defineConfig([
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: namingConfig[0].rules,
  },
]);
