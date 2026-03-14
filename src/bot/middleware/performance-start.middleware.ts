import type { NextFunction } from 'grammy';

import type { GrammyContext } from '@app-types/context';

import { environmentConfig } from '../../config';

/**
 * Used for performance checking
 * */
export function performanceStartMiddleware(context: GrammyContext, next: NextFunction) {
  if (environmentConfig.DEBUG) {
    context.state.performanceStart = performance.now();
  }

  return next();
}
