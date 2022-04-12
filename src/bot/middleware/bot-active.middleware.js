const { logSkipMiddleware } = require('../../utils');

/**
 * Used for performance checking
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
function botActiveMiddleware(ctx, next) {
  // TODO use for ctx prod debug
  // console.info('enter botActiveMiddleware ******', ctx.chat?.title, '******', ctx.state.text);

  if (ctx.chat.type !== 'private' && !ctx.chatSession.botRemoved && ctx.chatSession.isBotAdmin) {
    return next();
  }

  if (ctx.chat.type === 'private') {
    return next();
  }

  logSkipMiddleware(ctx, 'bot kicked or not admin', ctx.chatSession);
}

module.exports = {
  botActiveMiddleware,
};
