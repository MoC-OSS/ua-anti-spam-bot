import type { GrammyMiddleware } from '@app-types/context';

import { logger } from '@utils/logger.util';

/**
 * Used to test global error handling
 * @deprecated
 */
export const throwErrorMiddleware: GrammyMiddleware = () => {
  logger.info('throwErrorMiddleware called');
  throw new Error('Test error');
};
