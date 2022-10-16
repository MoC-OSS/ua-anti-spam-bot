import { environmentConfig } from 'config';
import type { Bot, NextFunction } from 'grammy';
import type { AirRaidAlertSettings, ChatSettings, GrammyContext, GrammyMiddleware } from 'types';

import {
  adminReadyHasNoDeletePermissionMessage,
  adminReadyMessage,
  getBotJoinMessage,
  getStartChannelMessage,
  memberReadyMessage,
} from '../../message';
import { emptyFunction, handleError, logContext, telegramUtil } from '../../utils';

export class GlobalMiddleware {
  constructor(private bot: Bot<GrammyContext>) {}

  /**
   * Global middleware.
   * Checks some bot information and updates the session
   * */
  middleware(): GrammyMiddleware {
    return async (context: GrammyContext, next: NextFunction) => {
      /**
       * Channels doesn't have session.
       * TODO create a middleware to skip it
       * */
      if (!context.chatSession || !context.session) {
        if (environmentConfig.DEBUG) {
          handleError(new Error('No session'), 'SESSION_ERROR');
        }

        return next();
      }

      if (!environmentConfig.TEST_TENSOR) {
        logContext(context);
      }

      this.createState(context);
      this.updateChatInfo(context);
      await this.updateChatSessionIfEmpty(context);
      await this.handleBotInvite(context);
      this.handleBotKick(context);
      await this.handlePromoteAndDemote(context);

      return next();
    };
  }

  updateChatInfo(context: GrammyContext) {
    context.chatSession.chatType = context.chat?.type;
    context.chatSession.chatTitle = telegramUtil.getChatTitle(context.chat);

    const defaultAirRaidAlertSettings: AirRaidAlertSettings = {
      pageNumber: 1,
      state: null,
      notificationMessage: false,
    };

    const defaultChatSettings: ChatSettings = {
      airRaidAlertSettings: defaultAirRaidAlertSettings,
      disableChatWhileAirRaidAlert: false,
    };

    if (context.chatSession.chatSettings === undefined) {
      context.chatSession.chatSettings = defaultChatSettings;
    }

    if (context.chatSession.chatSettings.disableChatWhileAirRaidAlert === undefined) {
      context.chatSession.chatSettings.disableChatWhileAirRaidAlert = defaultChatSettings.disableChatWhileAirRaidAlert;
    }

    if (context.chatSession.chatSettings.airRaidAlertSettings === undefined) {
      context.chatSession.chatSettings.airRaidAlertSettings = defaultAirRaidAlertSettings;
    }

    context
      .getChatMembersCount()
      .then((count) => {
        context.chatSession.chatMembersCount = count;
      })
      .catch(handleError);
  }

  /**
   * @param {GrammyContext} context
   * */
  async updateChatSessionIfEmpty(context: GrammyContext) {
    /**
     * Private always not kicked and admin
     * TODO handle private ban
     * */
    if (context.chat?.type === 'private') {
      context.chatSession.botRemoved = false;
      context.chatSession.isBotAdmin = true;
      return;
    }

    /**
     * Handle no remove status
     * */
    if (context.chatSession.botRemoved === undefined) {
      await context
        .getChat()
        .then(() => {
          context.chatSession.botRemoved = false;
        })
        .catch(() => {
          context.chatSession.botRemoved = true;
        });
    }

    /**
     * Handle no bot admin status
     * */
    if (context.chatSession.isBotAdmin === undefined) {
      await context
        .getChatAdministrators()
        .then((admins) => {
          const isBotAdmin = (admins || []).some((member) => member.user?.id === context.me.id);
          context.chatSession.isBotAdmin = isBotAdmin;
          context.chatSession.botAdminDate = isBotAdmin ? new Date() : null;
        })
        .catch(emptyFunction);
    }
  }

  createState(context: GrammyContext) {
    if (!context.state) {
      context.state = {};
    }
  }

  handleBotInvite(context: GrammyContext) {
    // TODO rework with grammy queries
    const addedMember = context.msg?.new_chat_members;
    const foundMe = addedMember?.some((member) => member.id === context.me.id);

    if (foundMe && context.chat?.type !== 'private' && context.chat?.id) {
      return telegramUtil
        .getChatAdmins(this.bot, context.chat.id)
        .then(({ adminsString }) => context.replyWithHTML(getBotJoinMessage({ adminsString, isAdmin: context.chatSession.isBotAdmin })))
        .catch(handleError);
    }
  }

  handleBotKick(context: GrammyContext) {
    // TODO rework with grammy queries
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const isBotRemoved = context.msg?.left_chat_participant?.id === context.me.id;
    context.chatSession.botRemoved = isBotRemoved;

    if (isBotRemoved) {
      delete context.chatSession.isBotAdmin;
      delete context.chatSession.botAdminDate;
    }
  }

  async handlePromoteAndDemote(context: GrammyContext) {
    const oldPermissionsMember = context.myChatMember?.old_chat_member;
    const updatePermissionsMember = context.myChatMember?.new_chat_member;
    const isUpdatedToAdmin = updatePermissionsMember?.user?.id === context.me.id && updatePermissionsMember?.status === 'administrator';
    const isDemotedToMember =
      updatePermissionsMember?.user?.id === context.me.id &&
      updatePermissionsMember?.status === 'member' &&
      oldPermissionsMember?.status === 'administrator';

    if (isUpdatedToAdmin) {
      if (context.chat?.type === 'channel') {
        await context.replyWithHTML(getStartChannelMessage({ botName: context.me.username })).catch(handleError);
      } else {
        context.chatSession.botAdminDate = new Date();
        context.chatSession.isBotAdmin = true;
        context
          .reply(updatePermissionsMember.can_delete_messages ? adminReadyMessage : adminReadyHasNoDeletePermissionMessage)
          .catch(handleError);
      }
    }

    if (isDemotedToMember) {
      delete context.chatSession.botAdminDate;
      context.chatSession.isBotAdmin = false;
      context.reply(memberReadyMessage).catch(handleError);
    }
  }
}
