import { hasNoLinkedChats, isNotAdminMessage, linkToWebView } from '../../../message';
import { redisService } from '../../../services';
import type { GrammyMiddleware, Session } from '../../../types';

export class SettingsCommand {
  middleware(): GrammyMiddleware {
    return async (context) => {
      const isChatPrivate = context.chat?.type === 'private';
      const userId = context.from?.id.toString() ?? '';
      const chatId = context.chat?.id.toString() ?? '';
      const { isBotAdmin } = context.chatSession;

      await context
        .deleteMessage()
        .then(() => true)
        .catch(() => false);

      if (!userId) {
        throw new Error('Invalid user id');
      }

      if (isChatPrivate) {
        const userSession = await redisService.getUserSession(userId);
        const chats = userSession?.linkedChats || [];
        return chats.length > 0 ? context.reply(linkToWebView) : context.reply(hasNoLinkedChats);
      }

      if (!isChatPrivate) {
        const admins = await context.api.getChatAdministrators(chatId);
        const isNotAdmin = !admins.some((admin) => admin.user.id.toString() === userId);
        if (isNotAdmin) {
          return context.reply(isNotAdminMessage);
        }

        const userSession = await redisService.getUserSession(userId);
        const chats = userSession?.linkedChats || [];
        const isChatMissing = !chats.some((chat) => chat.id.toString() === chatId);

        if (isChatMissing && isBotAdmin) {
          const newData = { ...userSession, linkedChats: [...chats, { id: chatId, name: context.chat?.title }] } as Session;
          await redisService.setUserSession(userId, newData);
        }

        return context.reply(linkToWebView);
      }
    };
  }
}
