import { environmentConfig } from 'config';
import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

/**
 * Used for performance checking
 * */
export function performanceStartMiddleware(context: GrammyContext, next: NextFunction) {
  if (environmentConfig.DEBUG) {
    context.state.performanceStart = performance.now();
  }

  return next();
}
