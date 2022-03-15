/**
 * Used for performance checking
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
function botActiveMiddleware(ctx, next) {
  console.info('enter botActiveMiddleware');

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
