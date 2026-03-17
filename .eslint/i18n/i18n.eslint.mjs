import { fixupPluginRules } from '@eslint/compat';
import i18next from 'eslint-plugin-i18next';

/**
 * @description ESLint config for internationalization (i18n) in NestJS projects. Enforces no literal user-facing strings in TypeScript files, encouraging the use of i18nService.t(...) for translations.
 * @author Dmytro Vakulenko
 * @see https://github.com/edvardchen/eslint-plugin-i18next
 */
export default [
  // Disallow literal user-facing strings in Nest code
  {
    files: ['**/*.ts'],
    ignores: ['tests/**', 'src/**/exceptions/**', '**/migrations/**', 'src/config/**', 'src/**/__mocks__/**', 'dataset/**'],
    ...i18next.configs['flat/recommended'],
    plugins: { i18next: fixupPluginRules(i18next) },
    rules: {
      // Core rule: push developers to use i18nService.t(...)
      'i18next/no-literal-string': ['error', { mode: 'all' }],
    },
  },
];
