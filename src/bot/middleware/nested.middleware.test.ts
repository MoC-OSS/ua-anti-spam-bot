const { nestedMiddleware } = require('./nested.middleware');

describe('nestedMiddleware', () => {
  it('should call all middlewares', async () => {
    const mockMiddleware = jest.fn(async (ctx, next) => {
      await next();
    });

    const finalMockMiddleware = jest.fn(() => {});

    await nestedMiddleware(
      async (ctx, next) => {
        await next();
      },
      mockMiddleware,
      mockMiddleware,
    )({}, finalMockMiddleware);

    expect(mockMiddleware).toBeCalledTimes(2);
    expect(finalMockMiddleware).toBeCalled();
  });

  it('should not call all middlewares', async () => {
    const mockMiddleware = jest.fn(async (ctx, next) => {
      await next();
    });

    const finalMockMiddleware = jest.fn(() => {});

    await nestedMiddleware(
      async () => {
        // we're not calling this
        // await next();
      },
      mockMiddleware,
      mockMiddleware,
    )({}, finalMockMiddleware);

    expect(mockMiddleware).not.toBeCalled();
    expect(finalMockMiddleware).toBeCalled();
  });
});
