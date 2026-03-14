import vitest from '@vitest/eslint-plugin';

/**
 * @description ESLint config for Vitest test files. Applies recommended Vitest rules to files in the tests/ directory.
 * @author Dmytro Vakulenko
 * @see https://github.com/vitest-dev/eslint-plugin-vitest
 */
export default [
  {
    name: vitest.configs.recommended.name,
    files: ['tests/**', 'test/**', '**/*.spec.{js,ts,jsx,tsx}'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      'import/no-extraneous-dependencies': 'off',
      'vitest/consistent-test-filename': ['error', { pattern: String.raw`\.spec\.(js|ts|jsx|tsx)$` }],
      'vitest/max-nested-describe': ['error', { max: 3 }],
      'vitest/valid-title': 'off',
      'vitest/prefer-describe-function-title': 'off',
      'no-process-env': 'off', // Disable the rule for these specific files
    },
  },
];
