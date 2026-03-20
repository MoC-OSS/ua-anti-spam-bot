import type { NextFunction } from 'grammy';

import type { GrammyContext, GrammyMiddleware } from '@app-types/context';

/**
 * Converts a Grammy middleware into a boolean filter.
 * Runs the middleware and returns `true` if `next()` was called, `false` otherwise.
 * @param middleware - The Grammy middleware to wrap as a filter
 * @returns An async filter function that returns true if next() was called by the middleware
 */
export function middlewareToFilter(middleware: GrammyMiddleware) {
  let isNextCalled = false;

  const callNext: NextFunction = () => {
    isNextCalled = true;

    return Promise.resolve();
  };

  return async (context: GrammyContext): Promise<boolean> => {
    await middleware(context, callNext);

    return isNextCalled;
  };
}
