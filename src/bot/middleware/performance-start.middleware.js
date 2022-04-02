const { env } = require('typed-dotenv').config();

/**
 * Used for performance checking
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
function performanceStartMiddleware(ctx, next) {
  if (env.DEBUG) {
    ctx.state.performanceStart = performance.now();
  }

  return next();
}

module.exports = {
  performanceStartMiddleware,
};
