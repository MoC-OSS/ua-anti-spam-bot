import path from 'node:path';
import { fileURLToPath } from 'node:url';

import simpleImportSort from 'eslint-plugin-simple-import-sort';

import { eslintLogger } from '../logger.mjs';
import { resolveTsconfigPaths } from '../tsconfig.utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootTsconfigPath = path.resolve(__dirname, '../../tsconfig.json');
const allPaths = resolveTsconfigPaths(rootTsconfigPath);

let tsconfigPathsGroups = [];
const logger = eslintLogger('ordered-imports');

if (allPaths && typeof allPaths === 'object' && Object.keys(allPaths).length > 0) {
  tsconfigPathsGroups = Object.keys(allPaths).map((key) => {
    const clearKey = key.replace('/*', '');

    return [`^${clearKey}(/.*|$)?`];
  });

  logger.info('Resolved tsconfig paths groups for ordered-imports:', tsconfigPathsGroups);
} else {
  logger.info('No tsconfig paths found for ordered-imports. Internal package import groups will not be generated.');
}

/**
 * @description ESLint config for enforcing dynamically resolved ordered imports in Node projects using eslint-plugin-simple-import-sort. Automatically generates import groups from tsconfig.json path aliases for internal packages, ensuring import order matches project structure and alias configuration. This helps maintain consistent and logical import organization, especially in monorepos or projects with custom path aliases.
 * @author Dmytro Vakulenko
 * @see https://github.com/lydell/eslint-plugin-simple-import-sort
 * @see https://www.typescriptlang.org/tsconfig#paths
 */
export default [
  {
    name: 'ordered-imports',
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // Disable conflicting rules from other plugins.
      // Stylistic plugin conflicts with import sorting.
      'simple-import-sort/exports': 'off',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Packages `node` related packages come first.
            ['^node'],
            // Nest
            ['^@?nestjs'],
            // React and related packages.
            ['^react', String.raw`^@?\w*react`, String.raw`^@?\w*jsx-runtime`],
            // All other npm packages.
            [String.raw`^@?\w`],
            // Internal packages (split by alias).
            ...tsconfigPathsGroups,
            // Side effect imports.
            [String.raw`^\u0000`],
            // Parent imports. Put `..` last.
            [String.raw`^\.\.(?!/?$)`, String.raw`^\.\./?$`],
            // Other relative imports. Put same-folder imports and `.` last.
            [String.raw`^\./(?=.*/)(?!/?$)`, String.raw`^\.(?!/?$)`, String.raw`^\./?$`],
            // Style imports.
            [String.raw`^.+\.?(css)$`],
          ],
        },
      ],
    },
  },
];
