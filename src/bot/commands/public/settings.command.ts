import pIteration from 'p-iteration';

import { onlyNotAdminFilter } from '@bot/filters/only-not-admin.filter';
import { onlyWhenBotAdminFilter } from '@bot/filters/only-when-bot-admin.filter';

import { featureNoAdminMessage } from '@message';
import { hasNoLinkedChats, isNotAdminMessage, linkToWebView } from '@message/settings.message';

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
      const isNotAdmin = onlyNotAdminFilter(context);
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

        return chats.length > 0 ? context.reply(linkToWebView) : context.reply(hasNoLinkedChats);
      }

      if (!isChatPrivate) {
        if (isNotAdmin) {
          return context.replyWithSelfDestructedHTML(isNotAdminMessage);
        }

        if (!isBotAdmin) {
          return context.replyWithSelfDestructedHTML(featureNoAdminMessage);
        }

        const chatTitle = context.chat?.title;
        const admins = await context.getChatAdministrators();

        await pIteration.forEachSeries(admins, async (admin) => {
          const adminUserId = admin.user.id.toString();
          const userSession = await this.redisService.getUserSession(adminUserId);

          const chats = userSession?.linkedChats || [];
          const isChatMissing = !chats.some((chat) => chat.id.toString() === chatId);

          if (isChatMissing && isBotAdmin) {
            const newData = { ...userSession, linkedChats: [...chats, { id: chatId, name: chatTitle }] } as Session;

            await this.redisService.setUserSession(adminUserId, newData);
          }
        });

        return context.replyWithSelfDestructedHTML(linkToWebView);
      }

      // eslint-disable-next-line unicorn/no-useless-undefined
      return undefined;
    };
  }
}
