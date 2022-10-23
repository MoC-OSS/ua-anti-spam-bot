import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { nestedMiddleware } from './nested.middleware';

const mockContext = {} as Partial<GrammyContext> as GrammyContext;

describe('nestedMiddleware', () => {
  it('should call all middlewares', async () => {
    const mockMiddleware = jest.fn(async (context, next: NextFunction) => {
      await next();
    });

    const finalMockMiddleware = jest.fn();

    await nestedMiddleware(
      async (context: GrammyContext, next: NextFunction) => {
        await next();
      },
      mockMiddleware,
      mockMiddleware,
    )(mockContext, finalMockMiddleware);

    expect(mockMiddleware).toHaveBeenCalledTimes(2);
    expect(finalMockMiddleware).toHaveBeenCalled();
  });

  it('should not call all middlewares', async () => {
    const mockMiddleware = jest.fn(async (context: GrammyContext, next: NextFunction) => {
      await next();
    });

    const finalMockMiddleware = jest.fn();

    await nestedMiddleware(
      async () => {
        // we're not calling this
        // await next();
      },
      mockMiddleware,
      mockMiddleware,
    )(mockContext, finalMockMiddleware);

    expect(mockMiddleware).not.toHaveBeenCalled();
    expect(finalMockMiddleware).toHaveBeenCalled();
  });
});
