import type { NextFunction } from 'grammy';

import { environmentConfig } from '@shared/config';

import type { GrammyContext } from '@app-types/context';

/**
 * Used for performance checking
 * @param context
 * @param next
 */
export function performanceStartMiddleware(context: GrammyContext, next: NextFunction) {
  if (environmentConfig.DEBUG) {
    context.state.performanceStart = performance.now();
  }

  return next();
}
