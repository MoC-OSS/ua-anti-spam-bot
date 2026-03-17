import unusedImports from 'eslint-plugin-unused-imports';

/**
 * @description ESLint config for removing unused imports using eslint-plugin-unused-imports. Automatically detects and removes unused imports to keep code clean.
 * @author Dmytro Vakulenko
 * @see https://github.com/sweepline/eslint-plugin-unused-imports
 */
export default [
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
    },
  },
];
