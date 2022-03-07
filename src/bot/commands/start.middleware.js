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
        return ctx
          .reply(
            joinMessage([
              'Привіт! 🇺🇦✌️',
              '',
              'Я чат-бот, який дозволяє автоматично видаляти повідомлення, що містять назви локацій міста, укриттів, а також ключові слова переміщення військ.',
              '',
              '<b>Як мене запустити?</b>',
              '',
              'Додай мене і зроби адміністратором:',
              '• Або в звичайну групу;',
              '• Або в чат каналу.',
              '',
              'Якщо є запитання або бот не працює, пишіть @dimkasmile',
            ]),
            { parse_mode: 'HTML' },
          )
          .catch(handleError);
      }

      telegramUtil.getChatAdmins(this.bot, ctx.chat.id).then(({ adminsString }) => {
        ctx
          .reply(
            joinMessage([
              '<b>Зроби мене адміністратором, щоб я міг видаляти повідомлення.</b>',
              '',
              adminsString ? `Це може зробити: ${adminsString}` : 'Це може зробити творець чату',
            ]).trim(),
            { parse_mode: 'HTML' },
          )
          .catch((getAdminsError) => {
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
