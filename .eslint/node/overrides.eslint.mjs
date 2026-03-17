/**
 * @description ESLint config for TypeScript and test file overrides. Enforces TS-specific rules and disables conflicting JS rules.
 * @author Dmytro Vakulenko
 */
export default [
  {
    name: 'overrides-ts',
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      'import/prefer-default-export': 'off',
      'import/no-unresolved': 'off', // for path aliases

      // prefer the TS-specific version of these:
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': 'error',

      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      // disable base rule; @typescript-eslint/no-unused-vars is a superset
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: true,
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/array-type': 'error',
    },
  },
  // Test-file override
  {
    name: 'overrides-test',
    files: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-param-type': 'off',
    },
  },
  // Disable no-extraneous-class for module files (e.g. NestJS *.module.ts)
  {
    name: 'overrides-modules',
    files: ['**/*.module.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
];
