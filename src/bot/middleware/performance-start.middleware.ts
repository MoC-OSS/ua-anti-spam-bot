import type { NextFunction } from 'grammy';

import { environmentConfig } from '@shared/config';

import type { GrammyContext } from '@app-types/context';

/**
 * Used for performance checking
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export function performanceStartMiddleware(context: GrammyContext, next: NextFunction) {
  if (environmentConfig.DEBUG) {
    context.state.performanceStart = performance.now();
  }

  return next();
}
