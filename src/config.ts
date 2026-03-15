import * as typedDotenv from 'typed-dotenv';

import type { EnvironmentConfig } from './types/environment';
import { logger } from './utils/logger';

const { error, env } = typedDotenv.config();

if (error) {
  logger.error('Something wrong with env variables');
  logger.error(error);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit();
}

export const environmentConfig = env as unknown as EnvironmentConfig;
