/**
 * @description
 * Allow to skip a forwarded message
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
async function onlyNotForwarded(ctx, next) {
  // TODO use for ctx prod debug
  // console.info('enter onlyNotForwarded ******', ctx.chat?.title, '******', ctx.state.text);

  /**
   * Skip forwarded messages
   * */
  if (ctx.update?.message?.forward_from) {
    console.info('Skip due to regular forward');
    return;
  }

  return next();
}

module.exports = {
  onlyNotForwarded,
};
