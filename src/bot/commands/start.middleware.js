const { getStartMessage, getGroupStartMessage, makeAdminMessage } = require('../../message');
const { handleError, telegramUtil } = require('../../utils');

class StartMiddleware {
  /**
   * @param {Telegraf} bot
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
     * @param {TelegrafContext} ctx
     * */
    return (ctx) => {
      if (ctx?.update?.message?.chat?.type === 'private') {
        return ctx.replyWithHTML(getStartMessage()).catch(handleError);
      }

      telegramUtil.getChatAdmins(this.bot, ctx.chat.id).then(({ adminsString }) => {
        ctx.replyWithHTML(getGroupStartMessage({ adminsString })).catch((getAdminsError) => {
          handleError(getAdminsError);
          ctx.replyWithHTML(makeAdminMessage).catch(handleError);
        });
      });
    };
  }
}

module.exports = {
  StartMiddleware,
};
