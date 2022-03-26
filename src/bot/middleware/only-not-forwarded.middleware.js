/**
 * @description
 * Allow to execute next middlewares only if the user is not admin
 *
 * Reversed copy from
 * @see https://github.com/backmeupplz/grammy-middlewares/blob/main/src/middlewares/onlyAdmin.ts
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
async function onlyNotForwarded(ctx, next) {
  // TODO use for ctx prod debug
  // console.info('enter onlyNotAdmin ******', ctx.chat?.title, '******', ctx.msg?.text);

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
