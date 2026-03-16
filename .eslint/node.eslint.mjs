import path from 'node:path';

import { includeIgnoreFile } from '@eslint/compat';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

import lintlordEslint from './lintlord/lintlord.eslint.mjs';
import airbnbBaseEslint from './node/airbnb-base.eslint.mjs';
import customStyleEslint from './node/custom-style.eslint.mjs';
import eslintRulesEslint from './node/eslint-rules.eslint.mjs';
import importAliasEslint from './node/import-alias.eslint.mjs';
import jsdocEslint from './node/jsdoc.eslint.mjs';
import nConfig from './node/n.eslint.mjs';
import namingEslint from './node/naming.eslint.mjs';
import noBarrelFilesEslint from './node/no-barrel-files.eslint.mjs';
import noSecretsEslint from './node/no-secrets.eslint.mjs';
import orderedImportsEslint from './node/ordered-imports.eslint.mjs';
import overridesEslint from './node/overrides.eslint.mjs';
import perfectionistEslint from './node/perfectionist.eslint.mjs';
import prettierEslint from './node/prettier.eslint.mjs';
import securityEslint from './node/security.eslint.mjs';
import sonarEslint from './node/sonar.eslint.mjs';
import stylisticEslint from './node/stylistic.eslint.mjs';
import typescriptProjectEslint from './node/typescript-project.eslint.mjs';
import unicornEslint from './node/unicorn.eslint.mjs';
import unusedImportsEslint from './node/unused-imports.eslint.mjs';
import { eslintLogger } from './logger.mjs';

const gitignorePath = path.resolve('.', '.gitignore');
const logger = eslintLogger('node');

logger.info('Using .gitignore file at:', gitignorePath);

export default [
  {
    // Ignore node_modules folder in eslint
    name: 'ignore node_modules',
    ignores: ['node_modules'],
  },
  // Ignore .gitignore files/folder in eslint
  includeIgnoreFile(gitignorePath),
  // Core Javascript rules
  pluginJs.configs.recommended,
  // TypeScript recommended rules
  {
    name: '@typescript-eslint/recommended (type-checked)',
    files: ['**/*.ts', '**/*.tsx'],
    ...tseslint.configs.recommendedTypeChecked[0],
  },
  // TypeScript stylistic rules
  {
    name: '@typescript-eslint/stylistic (type-checked)',
    files: ['**/*.ts', '**/*.tsx'],
    ...tseslint.configs.stylisticTypeChecked[0],
  },
  // TypeScript strict rules
  {
    name: '@typescript-eslint/strict (type-checked)',
    files: ['**/*.ts', '**/*.tsx'],
    ...tseslint.configs.strictTypeChecked[0],
  },
  // Airbnb base style for Node.js
  ...airbnbBaseEslint,
  // Naming convention rules for TypeScript
  ...namingEslint,
  // JSDoc rules with separate JS and TS presets
  ...jsdocEslint,
  // Stylistic rules for JS/TS
  ...stylisticEslint,
  // Node.js best practices (eslint-plugin-n)
  ...nConfig,
  // Rules for ESLint config files
  ...eslintRulesEslint,
  // SonarJS code quality and security
  ...sonarEslint,
  // Prettier integration for formatting
  ...prettierEslint,
  // Dynamic ordered imports
  ...orderedImportsEslint,
  // Import alias support
  ...importAliasEslint,
  // Unused imports detection and removal
  ...unusedImportsEslint,
  // Secret detection rules
  ...noSecretsEslint,
  // Node.js security rules
  ...securityEslint,
  // Code sorting and organization
  ...perfectionistEslint,
  // Unicorn plugin for best practices
  ...unicornEslint,
  // No barrel files rules
  ...noBarrelFilesEslint,
  // Custom lintlord rules for JS/TS
  ...lintlordEslint,
  // TypeScript and test file overrides
  ...overridesEslint,
  // Custom style rules for JS/TS
  ...customStyleEslint,
  // TypeScript ESLint rules for project (with parserOptions.project)
  ...typescriptProjectEslint,
];
