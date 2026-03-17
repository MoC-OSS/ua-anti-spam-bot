import pluginSecurity from 'eslint-plugin-security';

/**
 * @description ESLint config for Node.js security. Applies recommended security rules to identify potential vulnerabilities using eslint-plugin-security.
 * @author Dmytro Vakulenko
 * @see https://github.com/nodesecurity/eslint-plugin-security
 */
export default [
  {
    name: 'security',
    ...pluginSecurity.configs.recommended,
  },
];
