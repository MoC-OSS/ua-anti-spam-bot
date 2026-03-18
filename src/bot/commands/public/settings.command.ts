import { onlyWhenBotAdminFilter } from '@bot/filters/only-when-bot-admin.filter';

import { getHasNoLinkedChats, getIsNotAdminMessage, getLinkToWebView } from '@message/settings.message';

import type { RedisService } from '@services/redis.service';

import type { GrammyMiddleware } from '@app-types/context';
import type { Session } from '@app-types/session';

export class SettingsCommand {
  constructor(private redisService: RedisService) {}

  middleware(): GrammyMiddleware {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context) => {
      const isChatPrivate = context.chat?.type === 'private';
      const userId = context.from?.id.toString() ?? '';
      const chatId = context.chat?.id.toString() ?? '';
      const isActualUserAdmin = Boolean(context.state.isActualUserAdmin);
      const isBotAdmin = onlyWhenBotAdminFilter(context);

      await context
        .deleteMessage()
        .then(() => true)
        .catch(() => false);

      if (!userId) {
        throw new Error('Invalid user id');
      }

      if (isChatPrivate) {
        const userSession = await this.redisService.getUserSession(userId);
        const chats = userSession?.linkedChats || [];

        return chats.length > 0 ? context.reply(getLinkToWebView(context)) : context.reply(getHasNoLinkedChats(context));
      }

      if (!isChatPrivate) {
        if (!isActualUserAdmin) {
          return context.replyWithSelfDestructedHTML(getIsNotAdminMessage(context));
        }

        if (!isBotAdmin) {
          return context.replyWithSelfDestructedHTML(context.t('bot-feature-no-admin'));
        }

        const chatTitle = context.chat?.title;
        const admins = await context.getChatAdministrators();

        for (const admin of admins) {
          const adminUserId = admin.user.id.toString();
          // eslint-disable-next-line no-await-in-loop
          const userSession = await this.redisService.getUserSession(adminUserId);

          const chats = userSession?.linkedChats || [];
          const isChatMissing = !chats.some((chat) => chat.id.toString() === chatId);

          if (isChatMissing && isBotAdmin) {
            const newData = { ...userSession, linkedChats: [...chats, { id: chatId, name: chatTitle }] } as Session;

            // eslint-disable-next-line no-await-in-loop
            await this.redisService.setUserSession(adminUserId, newData);
          }
        }

        return context.replyWithSelfDestructedHTML(getLinkToWebView(context));
      }

      // eslint-disable-next-line unicorn/no-useless-undefined
      return undefined;
    };
  }
}
