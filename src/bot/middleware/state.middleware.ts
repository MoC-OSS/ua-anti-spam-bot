import type { GrammyMiddleware } from '../../types';

/**
 * Add state into context
 * */
export const stateMiddleware: GrammyMiddleware = (context, next) => {
  if (!context.state) {
    context.state = {};
  }
  return next();
};
