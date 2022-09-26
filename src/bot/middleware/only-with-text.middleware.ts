const { logSkipMiddleware } = require('../../utils');

/**
 * @description
 * Skip messages without text
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
export function onlyWithText(ctx, next) {
  const text = ctx.msg.text || ctx.msg.caption;

  if (text) {
    ctx.state.text = text;
    return next();
  }

  logSkipMiddleware(ctx, 'no text');
}
