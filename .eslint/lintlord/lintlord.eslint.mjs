import { defineConfig } from 'eslint/config';
import lintlord from 'eslint-plugin-lintlord';

/**
 * @description ESLint config for enforcing no inline object types in TypeScript interfaces. Applies the custom rule defined in no-inline-interface-object-types.eslint.mjs to prevent usage of inline `{ ... }` types in interface properties, function parameters, etc. Can be configured to also forbid type aliases with inline object types.
 * @author Dmytro Vakulenko
 * @version 1.1.0
 */
export default defineConfig([
  lintlord.configs.strict,
  {
    rules: {
      'lintlord/prefer-logger': [
        'error',
        {
          mode: 'log-only',
        },
      ],
    },
  },
]);
