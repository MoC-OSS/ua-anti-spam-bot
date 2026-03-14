import noSecrets from 'eslint-plugin-no-secrets';

/**
 * @description ESLint config for detecting secrets and sensitive keys in code and JSON files using eslint-plugin-no-secrets.
 * @author Dmytro Vakulenko
 * @see https://github.com/nickdeis/eslint-plugin-no-secrets
 */
export default [
  {
    name: 'no-secrets',
    plugins: {
      'no-secrets': noSecrets,
    },
    rules: {
      'no-secrets/no-secrets': 'error',
    },
  },
];
