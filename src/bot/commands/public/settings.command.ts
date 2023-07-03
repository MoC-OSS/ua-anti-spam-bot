import { environmentConfig } from '../../../config';
import { redisService } from '../../../services';
import type { GrammyMiddleware, Session } from '../../../types';
// Todo change messages with needed text
export class SettingsCommand {
  middleware(): GrammyMiddleware {
    return async (context) => {
      const isChatPrivate = context.chat?.type === 'private';
      const userId = context.from?.id.toString() ?? '';
      const chatId = context.chat?.id.toString() ?? '';
      const linkToWebView = `Відкрити налаштування: ${environmentConfig.WEB_VIEW_URL}`;

      if (!userId) {
        throw new Error('Invalid user id');
      }

      if (isChatPrivate) {
        const userSession = await redisService.getUserSession(userId);
        const chats = userSession?.linkedChats || [];
        return chats.length > 0
          ? context.reply(linkToWebView)
          : context.reply(`You don't linked chats yet. Please, go in group and press /settings.`);
      }

      if (!isChatPrivate) {
        const admins = await context.api.getChatAdministrators(chatId);
        if (!admins.some((object) => object.user.id.toString() === userId)) {
          return context.reply(`You are not admin`);
        }

        const userSession = await redisService.getUserSession(userId);
        const chats = userSession?.linkedChats || [];
        const chatIndex = chats.findIndex((chat) => chat.id.toString() === chatId);

        if (chatIndex === -1) {
          const newData = { ...userSession, linkedChats: [...chats, { id: chatId, name: context.chat?.title }] } as Session;
          await redisService.setUserSession(userId, newData);
        }

        return context.reply(linkToWebView);
      }
    };
  }
}
