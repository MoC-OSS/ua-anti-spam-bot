const { somethingWentWrongMessage } = require('../message');
const { handleError } = require('./error.util');

/**
 * Wrapper to catch async errors within a stage. Helps to avoid try catch blocks in there
 * @param {function} fn - function to enter a stage
 */
const errorHandler =
  (fn) =>
  /**
   * @param {TelegrafContext} ctx
   * @param {Next} next
   * */
  async (ctx, next) => {
    try {
      return await fn(ctx, next);
    } catch (error) {
      handleError(error);
      await ctx.reply(somethingWentWrongMessage);
      return next();
    }
  };

module.exports = {
  errorHandler,
};
