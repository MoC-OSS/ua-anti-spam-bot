import type { GrammyMiddleware } from '@app-types/context';

import { logger } from '@utils/logger';

export const debugMiddleware =
  (name: string): GrammyMiddleware =>
  (context, next) => {
    logger.info({ context }, name);

    return next();
  };
