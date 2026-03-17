import type { GrammyMiddleware } from '@app-types/context';

import { logger } from '@utils/logger.util';

/**
 * Logs the full context object with a custom label. Always calls `next()`.
 * Use during development to inspect the context at a specific point in the middleware chain.
 * @param name - Label to prefix the logged context object
 * @returns A Grammy middleware function that logs the context and calls next
 */
export const debugMiddleware =
  (name: string): GrammyMiddleware =>
  (context, next) => {
    logger.info({ context }, name);

    return next();
  };
