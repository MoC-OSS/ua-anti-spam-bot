import path from 'node:path';
import { fileURLToPath } from 'node:url';

import importAlias from '@dword-design/eslint-plugin-import-alias';

import { eslintLogger } from '../logger.mjs';
import { parseTsconfig, resolveTsconfigPaths } from '../tsconfig.utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tsconfigPath = path.resolve(__dirname, '../../tsconfig.json');
const tsconfigContent = parseTsconfig(tsconfigPath);
const baseUrl = tsconfigContent.compilerOptions?.baseUrl || '';

const paths = resolveTsconfigPaths(tsconfigPath);

const aliases = Object.fromEntries(
  Object.entries(paths).map(([key, valueArray]) => {
    // Remove trailing /* from alias key
    const aliasKey = key.replace('/*', '');
    // Remove trailing /* from path value
    let aliasValue = valueArray[0].replace('/*', '');

    // Prepend baseUrl unless value is already absolute or relative
    if (!aliasValue.startsWith('.') && !aliasValue.startsWith('/')) {
      aliasValue = `${baseUrl.replace(/\/$/, '')}/${aliasValue}`;

      // Ensure ./ prefix for ESLint
      if (!aliasValue.startsWith('./') && !aliasValue.startsWith('/')) {
        aliasValue = `./${aliasValue}`;
      }
    }

    return [aliasKey, aliasValue];
  }),
);

const logger = eslintLogger('import-alias');

logger.info('Resolved import aliases from tsconfig paths:', aliases);

const aliasesCount = Object.keys(aliases).length;

/**
 * @description ESLint config for import alias linting using @dword-design/eslint-plugin-import-alias. Aliases are built dynamically from tsconfig.json using baseUrl.
 * @author Dmytro Vakulenko
 * @see https://github.com/dword-design/eslint-plugin-import-alias
 */
export default aliasesCount > 0
  ? [
      importAlias.configs.recommended,
      {
        name: 'import-alias',
        rules: {
          '@dword-design/import-alias/prefer-alias': [
            'error',
            {
              alias: aliases,
            },
          ],
        },
      },
    ]
  : [];
