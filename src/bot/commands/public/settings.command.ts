import pIteration from 'p-iteration';

import { featureNoAdminMessage, hasNoLinkedChats, isNotAdminMessage, linkToWebView } from '../../../message';
import type { RedisService } from '../../../services';
import type { GrammyMiddleware, Session } from '../../../types';
import { onlyNotAdminFilter, onlyWhenBotAdminFilter } from '../../filters';

export class SettingsCommand {
  constructor(private redisService: RedisService) {}

  middleware(): GrammyMiddleware {
    return async (context) => {
      const isChatPrivate = context.chat?.type === 'private';
      const userId = context.from?.id.toString() ?? '';
      const chatId = context.chat?.id.toString() ?? '';
      const isNotAdmin = await onlyNotAdminFilter(context);
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

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
    };
  }
}
