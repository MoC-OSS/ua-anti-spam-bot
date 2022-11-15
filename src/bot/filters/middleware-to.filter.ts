import type { NextFunction } from 'grammy';

import type { GrammyContext, GrammyMiddleware } from '../../types';

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
