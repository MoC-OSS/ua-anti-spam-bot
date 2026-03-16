import type { GrammyMiddleware } from '@app-types/context';

import { logContext } from '@utils/generic.util';

/**
 * Logs a summary of the current context for debugging purposes. Always calls `next()`.
 * @param context
 * @param next
 */
export const logContextMiddleware: GrammyMiddleware = (context, next) => {
  logContext(context);

  return next();
};
