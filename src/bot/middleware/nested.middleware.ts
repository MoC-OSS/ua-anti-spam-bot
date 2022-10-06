/**
 * @param {GrammyMiddleware} middlewares
 * @returns {GrammyMiddleware}
 * */
export const nestedMiddleware =
  (...middlewares) =>
  async (context, next) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const middleware of middlewares) {
      let isNextCalled = false;
      const localNext = () => {
        isNextCalled = true;
      };

      // eslint-disable-next-line no-await-in-loop
      await middleware(context, localNext);

      if (!isNextCalled) {
        break;
      }
    }

    await next();
  };

module.exports = {
  nestedMiddleware,
};
