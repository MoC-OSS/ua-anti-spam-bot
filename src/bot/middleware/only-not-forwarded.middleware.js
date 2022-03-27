/**
 * @description
 * Allow to skip a forwarded message
 *
 * Reversed copy from
 * @see https://github.com/backmeupplz/grammy-middlewares/blob/main/src/middlewares/onlyAdmin.ts
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
async function onlyNotForwarded(ctx, next) {
  // TODO use for ctx prod debug
  // console.info('enter onlyNotForwarded ******', ctx.chat?.title, '******', ctx.msg?.text);

  /**
   * Skip forwarded messages
   * */
  if (ctx.update.message.forward_from) {
    return;
  }
  return next();
}

module.exports = {
  onlyNotForwarded,
};
