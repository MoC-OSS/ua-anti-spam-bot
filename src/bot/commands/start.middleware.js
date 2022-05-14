const { getStartMessage, getGroupStartMessage, makeAdminMessage } = require('../../message');
const { handleError, telegramUtil } = require('../../utils');

class StartMiddleware {
  /**
   * @param {Bot} bot
   * */
  constructor(bot) {
    this.bot = bot;
  }

  /**
   * Handle /start
   * Returns help message
   *
   * */
  middleware() {
    /**
     * @param {GrammyContext} ctx
     * */
    return async (ctx) => {
      if (ctx.chat.type === 'private') {
        return ctx.replyWithHTML(getStartMessage());
      }

      const isAdmin = ctx.chatSession.isBotAdmin;
      const canDelete = await ctx
        .deleteMessage()
        .then(() => true)
        .catch(() => false);

      if (!isAdmin || !canDelete) {
        return ctx.replyWithHTML(getGroupStartMessage({ isAdmin, canDelete }));
      }

      telegramUtil.getChatAdmins(this.bot, ctx.chat.id).then(({ adminsString }) => {
        ctx.replyWithHTML(getGroupStartMessage({ adminsString, isAdmin, canDelete })).catch((getAdminsError) => {
          handleError(getAdminsError);
          ctx.replyWithHTML(makeAdminMessage);
        });
      });
    };
  }
}

module.exports = {
  StartMiddleware,
};
