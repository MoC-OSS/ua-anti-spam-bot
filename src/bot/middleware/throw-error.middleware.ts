import type { GrammyMiddleware } from '@app-types/context';

import { logger } from '@utils/logger';

/**
 * @deprecated
 * @description Used to test global error handling
 * */
export const throwErrorMiddleware: GrammyMiddleware = () => {
  logger.info('throwErrorMiddleware called');
  throw new Error('Test error');
};
