import sonarjs from 'eslint-plugin-sonarjs';

/**
 * @description ESLint config for SonarJS code quality and security rules. Applies recommended and custom rules for detecting code smells and vulnerabilities.
 * @author Dmytro Vakulenko
 * @see https://github.com/SonarSource/eslint-plugin-sonarjs
 */
export default [
  {
    name: 'sonar-recommended',
    ...sonarjs.configs.recommended,
  },
  {
    name: 'sonar-custom',
    rules: {
      'sonarjs/function-return-type': 'warn',
      'sonarjs/no-commented-code': 'warn',
      'sonarjs/no-selector-parameter': 'off',
      'sonarjs/redundant-type-aliases': 'off',
      'sonarjs/todo-tag': 'warn',
    },
  },
];
