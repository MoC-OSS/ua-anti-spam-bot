const { env } = require('typed-dotenv').config();

const { getBotJoinMessage, getStartChannelMessage, adminReadyMessage, memberReadyMessage } = require('../../message');
const { logCtx, handleError, telegramUtil } = require('../../utils');

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

      if (!ctx.session.settings) {
        ctx.session.settings = {};
      }

      if (ctx.botInfo?.id) {
        ctx.session.botId = ctx.botInfo?.id;
      }

      const addedMember = ctx?.update?.message?.new_chat_member;
      if (addedMember?.id === ctx.session.botId) {
        telegramUtil.getChatAdmins(this.bot, ctx.chat.id).then(({ adminsString }) => {
          ctx.replyWithHTML(getBotJoinMessage({ adminsString }));
        });
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
        ctx.session.botAdminDate = new Date();

        if (isChannel) {
          ctx.replyWithHTML(getStartChannelMessage({ botName: ctx.botInfo.username }));
        } else {
          ctx.reply(adminReadyMessage);
        }
      }

      if (isDemotedToMember) {
        ctx.session.isBotAdmin = false;
        ctx.reply(memberReadyMessage);
      }

      if (ctx.session.isBotAdmin === undefined) {
        ctx.telegram.getChatMember(telegramUtil.getMessage(ctx).chat.id, ctx.botInfo.id).then((member) => {
          ctx.session.isBotAdmin = member?.status === 'creator' || member?.status === 'administrator';

          if (ctx.session.isBotAdmin && !ctx.session.botAdminDate) {
            ctx.session.botAdminDate = new Date();
          }
        });
      }

      ctx.session.botRemoved = ctx?.update?.message?.left_chat_participant?.id === ctx.session.botId;

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
