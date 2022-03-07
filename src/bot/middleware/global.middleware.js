const { env } = require('typed-dotenv').config();

const { logCtx, handleError, telegramUtil, joinMessage } = require('../../utils');

/**
 * @typedef { import("telegraf").Context } TelegrafContext
 */

class GlobalMiddleware {
  /**
   * @param {Telegraf} bot
   * */
  constructor(bot) {
    this.bot = bot;
  }

  /**
   * Global middleware.
   * Checks some bot information and updates the session
   * */
  middleware() {
    /**
     * @param {TelegrafContext} ctx
     * @param {Next} next
     * */
    return (ctx, next) => {
      logCtx(ctx);

      if (!ctx.session) {
        if (env.DEBUG) {
          handleError(new Error('No session'), 'SESSION_ERROR');
        }
        return next();
      }

      if (ctx.botInfo?.id) {
        ctx.session.botId = ctx.botInfo?.id;
      }

      const addedMember = ctx?.update?.message?.new_chat_member;
      if (addedMember?.id === ctx.session.botId) {
        telegramUtil
          .getChatAdmins(this.bot, ctx.chat.id)
          .then(({ adminsString }) => {
            ctx
              .reply(
                joinMessage([
                  'Привіт! 🇺🇦✌️',
                  '',
                  'Я чат-бот, який дозволяє автоматично видаляти повідомлення, що містять назви локацій міста, укриттів, а також ключові слова переміщення військ.',
                  '',
                  '<b>Зроби мене адміністратором, щоб я міг видаляти повідомлення.</b>',
                  '',
                  adminsString ? `Це може зробити: ${adminsString}` : 'Це може зробити творець чату',
                ]).trim(),
                { parse_mode: 'HTML' },
              )
              .catch(handleError);
          })
          .catch(handleError);
      }

      const chatTitle = ctx?.update?.my_chat_member?.chat?.title || ctx?.update?.message?.chat?.title;
      const chatType = ctx?.update?.my_chat_member?.chat?.type || ctx?.update?.message?.chat?.type;
      const isChannel = chatType === 'channel';
      const oldPermissionsMember = ctx?.update?.my_chat_member?.old_chat_member;
      const updatePermissionsMember = ctx?.update?.my_chat_member?.new_chat_member;
      const isUpdatedToAdmin =
        updatePermissionsMember?.user?.id === ctx.session.botId && updatePermissionsMember?.status === 'administrator';
      const isDemotedToMember =
        updatePermissionsMember?.user?.id === ctx.session.botId &&
        updatePermissionsMember?.status === 'member' &&
        oldPermissionsMember?.status === 'administrator';

      if (chatType) {
        ctx.session.chatType = chatType;
      }

      if (chatTitle) {
        ctx.session.chatTitle = chatTitle;
      }

      if (isUpdatedToAdmin) {
        ctx.session.isBotAdmin = true;
        if (isChannel) {
          ctx
            .reply(
              joinMessage([
                `Привіт! Повідомлення від офіційного чат-боту @${ctx.botInfo.username}.`,
                `Ви мене додали в <b>канал</b> як адміністратора, але я не можу перевіряти повідомлення в коментарях.`,
                '',
                'Видаліть мене і додайте в <b>чат каналу</b> каналу <b>як адміністратора</b>.',
                'Якщо є запитання, пишіть @dimkasmile',
              ]),
              { parse_mode: 'HTML' },
            )
            .catch(handleError);
        } else {
          ctx.reply('Тепер я адміністратор. Готовий до роботи 😎').catch(handleError);
        }
      }

      if (isDemotedToMember) {
        ctx.session.isBotAdmin = false;
        ctx.reply('Тепер я деактивований. Відпочиваю... 😴').catch(handleError);
      }

      if (ctx.session.isBotAdmin === undefined) {
        ctx.telegram
          .getChatMember(ctx.message.chat.id, ctx.botInfo.id)
          .catch(handleError)
          .then((member) => {
            ctx.session.isBotAdmin = member?.status === 'creator' || member?.status === 'administrator';
          });
      }

      if (ctx?.update?.message?.left_chat_participant?.id === ctx.session.botId) {
        ctx.session.botRemoved = true;
      } else {
        ctx.session.botRemoved = false;
      }

      if (ctx.chat.type === 'private') {
        return next();
      }

      try {
        if (ctx.session.botRemoved || !ctx.message) {
          return next();
        }

        // return next();

        return ctx.telegram
          .getChatMember(ctx.message.chat.id, ctx.message.from.id)
          .catch(handleError)
          .then((member) => {
            if (!member) {
              return next();
            }

            ctx.session.isCurrentUserAdmin = member.status === 'creator' || member.status === 'administrator';
            next();
          });
      } catch (e) {
        console.error(e);
        return next();
      }
    };
  }
}

module.exports = {
  GlobalMiddleware,
};
