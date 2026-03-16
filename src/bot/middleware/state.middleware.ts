import type { GrammyMiddleware } from '@app-types/context';

/**
 * Add state into context
 * @param context
 * @param next
 */
export const stateMiddleware: GrammyMiddleware = (context, next) => {
  if (!context.state) {
    context.state = {};
  }

  return next();
};
