const { env } = require('typed-dotenv').config();

/**
 * Used for performance checking
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
function performanceMiddleware(ctx, next) {
  if (env.DEBUG) {
    ctx
      .replyWithMarkdown(
        `*Time*: ${performance.now() - ctx.session.performanceStart}\n\nStart:\n${
          ctx.session.performanceStart
        }\n\nEnd:\n${performance.now()}`,
      )

      .then(() => next());
  } else {
    return next();
  }
}

module.exports = {
  performanceMiddleware,
};
