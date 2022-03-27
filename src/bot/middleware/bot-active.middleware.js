/**
 * Used for performance checking
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
function botActiveMiddleware(ctx, next) {
  // TODO use for ctx prod debug
  // console.info('enter botActiveMiddleware ******', ctx.chat?.title, '******', ctx.msg?.text);

  if (ctx.chat.type !== 'private' && !ctx.session.botRemoved && ctx.session.isBotAdmin) {
    return next();
  }

  if (ctx.chat.type === 'private') {
    return next();
  }
}

module.exports = {
  botActiveMiddleware,
};
