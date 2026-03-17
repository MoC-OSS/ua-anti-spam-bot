import type { GrammyMiddleware } from '@app-types/context';

/**
 * Add state into context
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export const stateMiddleware: GrammyMiddleware = (context, next) => {
  if (!context.state) {
    context.state = {};
  }

  return next();
};
