const { env } = require('typed-dotenv').config();

const { getBotJoinMessage, getStartChannelMessage, adminReadyMessage, memberReadyMessage } = require('../../message');
const { logCtx, handleError, telegramUtil } = require('../../utils');

class GlobalMiddleware {
  /**
   * @param {Bot} bot
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
     * @param {GrammyContext} ctx
     * @param {Next} next
     * */
    return (ctx, next) => {
      const chatType = ctx.chat?.type;

      ctx.session.chatType = chatType;
      ctx.session.chatTitle = ctx.chat?.title;
      ctx.session.botRemoved = ctx?.msg?.left_chat_participant?.id === ctx.me.id;

      logCtx(ctx);

      if (!ctx.state) {
        ctx.state = {};
      }

      if (!ctx.session) {
        if (env.DEBUG) {
          handleError(new Error('No session'), 'SESSION_ERROR');
        }
        return next();
      }

      // TODO commented for settings feature
      // if (!ctx.session.settings) {
      //   ctx.session.settings = {};
      // }

      const addedMember = ctx?.msg?.new_chat_member;
      if (addedMember?.id === ctx.me.id && chatType !== 'private') {
        telegramUtil.getChatAdmins(this.bot, ctx.chat.id).then(({ adminsString }) => {
          ctx.replyWithHTML(getBotJoinMessage({ adminsString }));
        });
      }

      const oldPermissionsMember = ctx?.myChatMember?.old_chat_member;
      const updatePermissionsMember = ctx?.myChatMember?.new_chat_member;
      const isUpdatedToAdmin = updatePermissionsMember?.user?.id === ctx.me.id && updatePermissionsMember?.status === 'administrator';
      const isDemotedToMember =
        updatePermissionsMember?.user?.id === ctx.me.id &&
        updatePermissionsMember?.status === 'member' &&
        oldPermissionsMember?.status === 'administrator';

      if (isUpdatedToAdmin) {
        ctx.session.isBotAdmin = true;
        ctx.session.botAdminDate = new Date();

        if (chatType === 'channel') {
          ctx.replyWithHTML(getStartChannelMessage({ botName: ctx.me.username }));
        } else {
          ctx.reply(adminReadyMessage);
        }
      }

      if (isDemotedToMember) {
        ctx.session.isBotAdmin = false;
        ctx.reply(memberReadyMessage);
      }

      if (ctx.session.isBotAdmin === undefined) {
        ctx.api.getChatMember(ctx.chat?.id, ctx.me.id).then((member) => {
          ctx.session.isBotAdmin = member?.status === 'creator' || member?.status === 'administrator';

          if (ctx.session.isBotAdmin && !ctx.session.botAdminDate) {
            ctx.session.botAdminDate = new Date();
          }
        });
      }

      if (ctx.chat.type === 'private') {
        return next();
      }

      try {
        if (ctx.session.botRemoved || !ctx.msg) {
          return next();
        }

        // return next();

        return ctx.api
          .getChatMember(ctx.chat.id, ctx.from.id)

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
