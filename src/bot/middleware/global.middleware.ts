import { Bot } from 'grammy';

const { env } = require('typed-dotenv').config();

import {
  adminReadyHasNoDeletePermissionMessage,
  adminReadyMessage,
  getBotJoinMessage,
  getStartChannelMessage,
  memberReadyMessage,
} from '../../message';
const { logCtx, handleError, telegramUtil } = require('../../utils');

class GlobalMiddleware {
  /**
   * @param {Bot} bot
   * */
  bot: Bot;
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
    const middleware = async (ctx, next) => {
      /**
       * Channels doesn't have session.
       * TODO create a middleware to skip it
       * */
      if (!ctx.chatSession || !ctx.session) {
        if (env.DEBUG) {
          handleError(new Error('No session'), 'SESSION_ERROR');
        }

        return next();
      }

      if (!env.TEST_TENSOR) {
        logCtx(ctx);
      }

      this.createState(ctx);
      this.updateChatInfo(ctx);
      await this.updateChatSessionIfEmpty(ctx);
      this.handleBotInvite(ctx);
      this.handleBotKick(ctx);
      await this.handlePromoteAndDemote(ctx);

      return next();
    };

    return middleware;
  }

  /**
   * @param {GrammyContext} ctx
   * */
  updateChatInfo(ctx) {
    ctx.chatSession.chatType = ctx.chat?.type;
    ctx.chatSession.chatTitle = ctx.chat?.title;

    if (ctx.chatSession.chatSettings === undefined) {
      ctx.chatSession.chatSettings = {};
    }

    if (ctx.chatSession.chatSettings.disableChatWhileAirRaidAlert === undefined) {
      ctx.chatSession.chatSettings.disableChatWhileAirRaidAlert = false;
    }

    if (ctx.chatSession.chatSettings.airRaidAlertSettings === undefined) {
      ctx.chatSession.chatSettings.airRaidAlertSettings = {
        pageNumber: 1,
        state: null,
        notificationMessage: false,
      };
    }

    ctx
      .getChatMembersCount()
      .then((count) => {
        ctx.chatSession.chatMembersCount = count;
      })
      .catch(handleError);
  }

  /**
   * @param {GrammyContext} ctx
   * */
  async updateChatSessionIfEmpty(ctx) {
    /**
     * Private always not kicked and admin
     * TODO handle private ban
     * */
    if (ctx.chat.type === 'private') {
      ctx.chatSession.botRemoved = false;
      ctx.chatSession.isBotAdmin = true;
      return;
    }

    /**
     * Handle no remove status
     * */
    if (ctx.chatSession.botRemoved === undefined) {
      await ctx
        .getChat()
        .then(() => {
          ctx.chatSession.botRemoved = false;
        })
        .catch(() => {
          ctx.chatSession.botRemoved = true;
        });
    }

    /**
     * Handle no bot admin status
     * */
    if (ctx.chatSession.isBotAdmin === undefined) {
      await ctx
        .getChatAdministrators()
        .then((admins) => {
          const isBotAdmin = (admins || []).some((member) => member.user?.id === ctx.me.id);
          ctx.chatSession.isBotAdmin = isBotAdmin;
          ctx.chatSession.botAdminDate = isBotAdmin ? new Date() : null;
        })
        .catch(() => {});
    }
  }

  /**
   * @param {GrammyContext} ctx
   * */
  createState(ctx) {
    if (!ctx.state) {
      ctx.state = {};
    }
  }

  /**
   * @param {GrammyContext} ctx
   * */
  handleBotInvite(ctx) {
    const addedMember = ctx?.msg?.new_chat_member;
    if (addedMember?.id === ctx.me.id && ctx.chat?.type !== 'private') {
      return telegramUtil
        .getChatAdmins(this.bot, ctx.chat.id)
        .then(({ adminsString }) => {
          ctx.replyWithHTML(getBotJoinMessage({ adminsString, isAdmin: ctx.chatSession.isBotAdmin }));
        })
        .catch(handleError);
    }
  }

  handleBotKick(ctx) {
    const isBotRemoved = ctx?.msg?.left_chat_participant?.id === ctx.me.id;
    ctx.chatSession.botRemoved = isBotRemoved;

    if (isBotRemoved) {
      delete ctx.chatSession.isBotAdmin;
      delete ctx.chatSession.botAdminDate;
    }
  }

  /**
   * @param {GrammyContext} ctx
   * */
  async handlePromoteAndDemote(ctx) {
    const oldPermissionsMember = ctx?.myChatMember?.old_chat_member;
    const updatePermissionsMember = ctx?.myChatMember?.new_chat_member;
    const isUpdatedToAdmin = updatePermissionsMember?.user?.id === ctx.me.id && updatePermissionsMember?.status === 'administrator';
    const isDemotedToMember =
      updatePermissionsMember?.user?.id === ctx.me.id &&
      updatePermissionsMember?.status === 'member' &&
      oldPermissionsMember?.status === 'administrator';

    if (isUpdatedToAdmin) {
      if (ctx.chat.type === 'channel') {
        ctx.replyWithHTML(getStartChannelMessage({ botName: ctx.me.username })).catch(handleError);
      } else {
        ctx.chatSession.botAdminDate = new Date();
        ctx.chatSession.isBotAdmin = true;
        ctx
          .reply(updatePermissionsMember.can_delete_messages ? adminReadyMessage : adminReadyHasNoDeletePermissionMessage)
          .catch(handleError);
      }
    }

    if (isDemotedToMember) {
      delete ctx.chatSession.botAdminDate;
      ctx.chatSession.isBotAdmin = false;
      ctx.reply(memberReadyMessage).catch(handleError);
    }
  }
}

module.exports = {
  GlobalMiddleware,
};
