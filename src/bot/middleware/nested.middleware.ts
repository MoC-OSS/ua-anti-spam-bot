import type { NextFunction } from 'grammy';

import type { GrammyContext, GrammyMiddleware } from '@app-types/context';

/**
 * Composes multiple middlewares sequentially, stopping at the first one that does not call next.
 * @param {GrammyMiddleware} middlewares
 * @returns {GrammyMiddleware}
 * */
export const nestedMiddleware =
  (...middlewares: GrammyMiddleware[]) =>
  async (context: GrammyContext, next: NextFunction) => {
    for (const middleware of middlewares) {
      let isNextCalled = false;

      // eslint-disable-next-line unicorn/consistent-function-scoping
      const localNext = () => {
        isNextCalled = true;

        return Promise.resolve();
      };

      // eslint-disable-next-line no-await-in-loop
      await middleware(context, localNext);

      if (!isNextCalled) {
        break;
      }
    }

    await next();
  };
