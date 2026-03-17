import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

import { eslintLogger } from './logger.mjs';

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);

// We need to go up one level since we are in the .eslint folder
export const __dirname = path.dirname(path.join(__filename));
const logger = eslintLogger('eslint-compat');

logger.info('ESLint Compat Base Directory:', __dirname);

export const compat = new FlatCompat({
  allConfig: js.configs.all,
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});
