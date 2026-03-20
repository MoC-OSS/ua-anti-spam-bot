import nodePlugin from 'eslint-plugin-n';

/**
 * @description ESLint config for Node.js best practices using eslint-plugin-n. Applies recommended rules for Node.js code quality and error prevention.
 * @author Dmytro Vakulenko
 * @see https://github.com/eslint-community/eslint-plugin-n
 */
export default [
  {
    name: 'n',
    ...nodePlugin.configs['flat/recommended-module'],
    rules: {
      'n/exports-style': ['error', 'exports'],
      'no-undef': 'off', // handled by TypeScript
    },
  },
];
