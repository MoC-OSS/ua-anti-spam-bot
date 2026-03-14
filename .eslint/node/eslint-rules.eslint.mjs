/**
 * @description ESLint config for rules specific to ESLint config files. Disables import/no-extraneous-dependencies and import/no-unresolved for config files.
 * @author Dmytro Vakulenko
 * @see https://github.com/import-js/eslint-plugin-import
 */
export default [
  {
    name: 'eslint-rules',
    files: ['./.eslint/**/*.{js,mjs,cjs,ts,tsx}', './eslint.config.mjs'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
      'import/no-unresolved': 'off',
    },
  },
];
