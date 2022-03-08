const { logsChat } = require('../creator');
// const { somethingWentWrongMessage } = require('../message');
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
      // await ctx.reply(somethingWentWrongMessage);
      ctx.telegram
        .sendMessage(
          logsChat,
          ['<b>Bot failed with message:</b>', error.message, '', '<b>Stack:</b>', `<code>${error.stack}</code>`].join('\n'),
          {
            parse_mode: 'HTML',
          },
        )
        .catch(handleError);
      return next();
    }
  };

module.exports = {
  errorHandler,
};
