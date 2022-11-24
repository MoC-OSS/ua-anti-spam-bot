import type { ChatMember } from '@grammyjs/types/manage';
import type { NextFunction } from 'grammy';

import { environmentConfig } from '../../config';
import type { AirRaidAlertSettings, ChatSettings, GrammyContext, GrammyMiddleware } from '../../types';
import { emptyFunction, handleError, logContext, telegramUtil } from '../../utils';

export class GlobalMiddleware {
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
        if (environmentConfig.DEBUG && context.chat?.type !== 'channel') {
          handleError(new Error('No session'), 'SESSION_ERROR');
        }

        return next();
      }

      if (!environmentConfig.TEST_TENSOR) {
        logContext(context);
      }

      this.createState(context);
      await this.updateChatInfo(context);
      await this.updateChatSessionIfEmpty(context);

      return next();
    };
  }

  async updateChatInfo(context: GrammyContext) {
    const leftStatuses = new Set<ChatMember['status']>(['left', 'kicked']);

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

    if (!leftStatuses.has(context.myChatMember?.new_chat_member.status || 'left')) {
      await context.getChatMembersCount().then((count) => {
        context.chatSession.chatMembersCount = count;
      });
    }
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
}
