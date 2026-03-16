import type { GrammyMiddleware } from '@app-types/context';

import { logContext } from '@utils/generic.util';

/**
 * Logs a summary of the current context for debugging purposes. Always calls `next()`.
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export const logContextMiddleware: GrammyMiddleware = (context, next) => {
  logContext(context);

  return next();
};
