/**
 * @module config
 * @description Loads environment variables via dotenv and validates them with Zod.
 *
 * This module is the single entry point for environment configuration across the
 * entire codebase. It:
 * 1. Loads `.env` via dotenv (in non-test environments).
 * 2. Parses and coerces `process.env` through the Zod schema, applying defaults.
 * 3. Exports the typed `environmentConfig` object used by all modules.
 *
 * Process-specific validation (required fields, format checks) is handled by
 * `validateBotEnvironment` (bot.schema.ts) and `validateServerEnvironment`
 * (server.schema.ts), which entry points call at startup.
 */

import dotenv from 'dotenv';

import type { EnvironmentConfig } from './env.schema';
import { environmentSchema } from './env.schema';
import { formatEnvironmentErrors } from './format-errors';

// Load .env file into process.env (no-op when vars are already set, e.g. in CI/Docker).
dotenv.config();

/**
 * Parse process.env through the Zod schema. This applies type coercion and
 * defaults but does not enforce process-specific required-field rules.
 * @returns The parsed environment configuration.
 */
function loadConfig(): EnvironmentConfig {
  const result = environmentSchema.safeParse(process.env);

  if (!result.success) {
    // eslint-disable-next-line lintlord/prefer-logger
    console.error(formatEnvironmentErrors(result.error));
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  }

  return result.data;
}

/**
 * The global environment configuration object.
 * All modules import this to access typed, validated env values.
 */
export const environmentConfig: EnvironmentConfig = loadConfig();
