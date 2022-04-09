const { logSkipMiddleware } = require('../../utils');

/**
 * @description
 * Skip messages before bot became admin
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
async function onlyWhenBotAdmin(ctx, next) {
  if (ctx.chat?.type === 'private') {
    return next();
  }

  const isMessageAfterBotAdmin = (ctx.msg?.date || 0) * 1000 > +new Date(ctx.chatSession.botAdminDate);

  if (!ctx.chatSession.botRemoved && isMessageAfterBotAdmin) {
    return next();
  }

  logSkipMiddleware(ctx, 'message is older than bot admin');
}

module.exports = {
  onlyWhenBotAdmin,
};
