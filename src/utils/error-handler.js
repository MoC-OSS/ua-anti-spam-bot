const { InputFile } = require('grammy');
const { env } = require('typed-dotenv').config();

const { logsChat } = require('../creator');
const { handleError } = require('./error.util');

/**
 * Wrapper to catch async errors within a stage. Helps to avoid try catch blocks in there
 * @param {function} fn - function to enter a stage
 */
const errorHandler =
  (fn) =>
  /**
   * @param {GrammyContext} ctx
   * @param {Next} next
   * */
  async (ctx, next) => {
    try {
      if (!fn) {
        console.error('errorHandler received an empty value instead of function.');
      }

      return await fn(ctx, next);
    } catch (error) {
      handleError(error);

      const writeCtx = JSON.parse(JSON.stringify(ctx));
      // noinspection JSConstantReassignment
      delete writeCtx.tg;
      delete writeCtx.telegram;
      delete writeCtx.api;

      console.error('*** CTX ***', writeCtx);

      if (!env.DEBUG) {
        ctx.api
          .sendMessage(
            logsChat,
            ['<b>Bot failed with message:</b>', error.message, '', '<b>Stack:</b>', `<code>${error.stack}</code>`].join('\n'),
            {
              parse_mode: 'HTML',
            },
          )
          .then(() =>
            ctx.api
              .sendDocument(logsChat, new InputFile(Buffer.from(JSON.stringify(writeCtx, null, 2)), `ctx-${new Date().toISOString()}.json`))
              .catch(handleError),
          )
          .catch(handleError);
      }

      return next();
    }
  };

module.exports = {
  errorHandler,
};
