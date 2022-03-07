const { getStartMessage, getGroupStartMessage } = require('../../message');
const { joinMessage, handleError, telegramUtil } = require('../../utils');

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
          ctx.reply(joinMessage(['<b>Зроби мене адміністратором, щоб я міг видаляти повідомлення.</b>']), { parse_mode: 'HTML' });
        });
      });
    };
  }
}

module.exports = {
  StartMiddleware,
};
