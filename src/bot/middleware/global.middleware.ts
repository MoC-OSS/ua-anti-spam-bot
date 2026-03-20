import type { ChatMember } from '@grammyjs/types/manage';
import type { NextFunction } from 'grammy';

import { environmentConfig } from '@shared/config';

import type { GrammyContext, GrammyMiddleware } from '@app-types/context';
import type { AirRaidAlertSettings, ChatSettings } from '@app-types/session';

import { emptyFunction } from '@utils/empty-functions.util';
import { handleError } from '@utils/error-handler.util';
import { telegramUtility } from '@utils/util-instances.util';

/**
 * Manages chat session initialization and updates on every incoming message.
 * Ensures chat info, bot admin status, and default settings are always up to date.
 */
export class GlobalMiddleware {
  /**
   * Global middleware.
   * Checks some bot information and updates the session
   * @returns A Grammy middleware function that initializes and refreshes the chat session
   */
  middleware(): GrammyMiddleware {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context: GrammyContext, next: NextFunction) => {
      /**
       * Channels doesn't have session.
       * NOTE create a middleware to skip it
       */
      if (!context.chatSession || !context.session) {
        if (environmentConfig.DEBUG && context.chat?.type !== 'channel') {
          handleError(new Error('No session'), 'SESSION_ERROR');
        }

        return next();
      }

      // Apply the per-chat language stored in the session. Defaults to Ukrainian
      // so the bot always speaks Ukrainian unless explicitly changed via /language.
      context.i18n.useLocale(context.chatSession.language ?? 'uk');

      await this.updateChatInfo(context);
      await this.updateChatSessionIfEmpty(context);

      return next();
    };
  }

  /**
   * Updates chat metadata (type, title, members count) and initializes default chat settings if missing.
   * @param context - The Grammy context object
   * @returns A promise that resolves when the chat info has been updated
   */
  async updateChatInfo(context: GrammyContext) {
    const leftStatuses = new Set<ChatMember['status']>(['left', 'kicked']);

    context.chatSession.chatType = context.chat?.type;
    context.chatSession.chatTitle = telegramUtility.getChatTitle(context.chat);

    const defaultAirRaidAlertSettings: AirRaidAlertSettings = {
      pageNumber: 1,
      state: null,
      notificationMessage: false,
    };

    const defaultChatSettings: ChatSettings = {
      airRaidAlertSettings: defaultAirRaidAlertSettings,
      disableChatWhileAirRaidAlert: false,
    };

    // eslint-disable-next-line sonarjs/different-types-comparison
    if (context.chatSession.chatSettings === undefined) {
      context.chatSession.chatSettings = defaultChatSettings;
    }

    // eslint-disable-next-line sonarjs/different-types-comparison
    if (context.chatSession.chatSettings.disableChatWhileAirRaidAlert === undefined) {
      context.chatSession.chatSettings.disableChatWhileAirRaidAlert = defaultChatSettings.disableChatWhileAirRaidAlert;
    }

    // eslint-disable-next-line sonarjs/different-types-comparison
    if (context.chatSession.chatSettings.airRaidAlertSettings === undefined) {
      context.chatSession.chatSettings.airRaidAlertSettings = defaultAirRaidAlertSettings;
    }

    if (!leftStatuses.has(context.myChatMember?.new_chat_member.status || 'left')) {
      // eslint-disable-next-line sonarjs/deprecation
      await context.getChatMembersCount().then((count) => {
        context.chatSession.chatMembersCount = count;
      });
    }
  }

  /**
   * Updates bot admin status and removal flags when chat session values are missing.
   * @param context - The Grammy context object
   * @returns A promise that resolves when the chat session has been updated
   */
  async updateChatSessionIfEmpty(context: GrammyContext) {
    /**
     * Private always not kicked and admin
     * NOTE handle private ban
     */
    if (context.chat?.type === 'private') {
      context.chatSession.botRemoved = false;
      context.chatSession.isBotAdmin = true;

      return;
    }

    /**
     * Handle no remove status
     */
    // eslint-disable-next-line sonarjs/different-types-comparison
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
     */
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
}
