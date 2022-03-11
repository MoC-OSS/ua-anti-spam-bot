const { logsChat } = require('../creator');
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

      const writeCtx = JSON.parse(JSON.stringify(ctx));
      // noinspection JSConstantReassignment
      delete writeCtx.tg;
      delete writeCtx.telegram;

      console.error('*** CTX ***', writeCtx);

      ctx.telegram
        .sendMessage(
          logsChat,
          ['<b>Bot failed with message:</b>', error.message, '', '<b>Stack:</b>', `<code>${error.stack}</code>`].join('\n'),
          {
            parse_mode: 'HTML',
          },
        )
        .then(() =>
          ctx.telegram
            .sendDocument(logsChat, {
              source: Buffer.from(JSON.stringify(writeCtx, null, 2)),
              filename: `ctx-${new Date().toISOString()}.json`,
            })
            .catch(handleError),
        )
        .catch(handleError);

      return next();
    }
  };

module.exports = {
  errorHandler,
};
