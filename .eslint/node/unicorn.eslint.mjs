import eslintPluginUnicorn from 'eslint-plugin-unicorn';

/**
 * @description ESLint config for enforcing best practices and code quality using eslint-plugin-unicorn. Applies recommended unicorn rules and customizations.
 * @author Dmytro Vakulenko
 * @see https://github.com/sindresorhus/eslint-plugin-unicorn
 */
export default [
  eslintPluginUnicorn.configs.recommended,
  {
    name: 'unicorn/custom',
    rules: {
      'unicorn/no-useless-switch-case': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          checkFilenames: false,
          allowList: {
            e2e: true,
            'e2e-spec': true,
            spec: true,
            param: true,
            Param: true,
          },
        },
      ],
    },
  },
];
