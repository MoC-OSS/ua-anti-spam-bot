/**
 * @module config
 * @description Loads and validates environment variables via typed-dotenv.
 * Exits the process immediately if required variables are missing.
 */

import * as typedDotenv from 'typed-dotenv';

import type { EnvironmentConfig } from './types/environment';

const { error, env } = typedDotenv.config();

if (error) {
  // eslint-disable-next-line lintlord/prefer-logger
  console.error('Something wrong with env variables');
  // eslint-disable-next-line lintlord/prefer-logger
  console.error(error);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit();
}

export const environmentConfig = env as unknown as EnvironmentConfig;
