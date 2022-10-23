import * as typedDotenv from 'typed-dotenv';

import type { EnvironmentConfig } from './types';

const { error, env } = typedDotenv.config();

if (error) {
  // eslint-disable-next-line no-console
  console.error('Something wrong with env variables');
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit();
}

export const environmentConfig = env as unknown as EnvironmentConfig;
