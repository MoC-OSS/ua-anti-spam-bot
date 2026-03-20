/* eslint-disable security/detect-non-literal-fs-filename */
import * as fs from 'node:fs';
import path from 'node:path';

import tseslint from 'typescript-eslint';

import { eslintLogger } from '../logger.mjs';

const logger = eslintLogger('typescript-project');

// Get the directory name in ES module scope
const tsconfigRootDirectory = path.join(path.dirname(new URL(import.meta.url).pathname), '../..');

const tsconfigPath = path.join(tsconfigRootDirectory, 'tsconfig.json');

const tsconfigScriptsPath = path.join(tsconfigRootDirectory, 'tsconfig.scripts.json');

if (!fs.existsSync(tsconfigPath)) {
  logger.warn(`Warning: tsconfig.json not found at ${tsconfigPath}. Please ensure the path is correct.`);
}

const scriptsConfig = fs.existsSync(tsconfigScriptsPath)
  ? {
      files: ['scripts/**/*.ts'],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          project: './tsconfig.scripts.json',
          tsconfigRootDir: tsconfigRootDirectory,
        },
      },
    }
  : {
      files: ['scripts/**/*.ts'],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          projectService: true,
          tsconfigRootDir: tsconfigRootDirectory,
        },
      },
    };

/**
 * @description ESLint config for TypeScript projects using project references. Configures the TypeScript parser with project settings to enable type-aware linting.
 * @author Dmytro Vakulenko
 * @see https://typescript-eslint.io/linting/typed-linting/
 */
export default [
  {
    files: ['**/*.{js,jsx,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['scripts/**'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: tsconfigRootDirectory,
      },
    },
  },
  scriptsConfig,
];
