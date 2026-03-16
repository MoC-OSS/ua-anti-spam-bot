import type { Bot } from 'grammy';

import axios from 'axios';

import { redisService } from '@services/redis.service';

import { environmentConfig } from '@shared/config';

import type { GrammyContext } from '@app-types/context';
import type { ChatDetails, LinkedChat, Session } from '@app-types/session';

import { logger } from '@utils/logger.util';

/**
 * Extracts the Telegram user ID from a Web App authorization header.
 * @param authorizationHeader
 */
export const getUserIdFromAuthorizationHeader = (authorizationHeader: string | undefined): string => {
  const userIdParameter: string = new URLSearchParams(authorizationHeader).get('user') || '';

  return JSON.parse(userIdParameter).id.toString() as string;
};

/**
 * Fetches the list of chats linked to a user from their Redis session.
 * @param userId
 */
export const getLinkedChats = async (userId: string) => {
  const userSessions = await redisService.getUserSession(userId);

  return userSessions?.linkedChats || [];
};

/**
 * Downloads a chat avatar via the Telegram Bot API and returns it as a base64 data URI.
 * @param bot
 * @param filePath
 */
export const getChatAvatar = async (bot: Bot<GrammyContext>, filePath: string) => {
  if (!filePath) {
    return '';
  }

  try {
    const photo = await bot.api.getFile(filePath);

    const arrayBuffer = await axios.get<Buffer>(
      `https://api.telegram.org/file/bot${environmentConfig.BOT_TOKEN}/${photo?.file_path ?? ''}`,
      {
        responseType: 'arraybuffer',
      },
    );

    const avatar = arrayBuffer.data.toString('base64');

    return `data:image/jpeg;base64, ${avatar}`;
  } catch (error) {
    logger.info(error);

    return '';
  }
};

const deletedChat = (id: string, name: string) => ({ id, name, photo: '', users: 0, isAdministrator: false });

/**
 * Fetches full details for all linked chats, updating stale chat names in Redis.
 * @param linkedChats
 * @param bot
 * @param userId
 */
export const updateChatsList = async (linkedChats: LinkedChat[], bot: Bot<GrammyContext>, userId: string) => {
  const chats = linkedChats.map(async (chat: LinkedChat, index: number) => {
    try {
      const chatInfo = await bot.api.getChat(chat.id);
      const chatMembers = await bot.api.getChatMemberCount(chat.id);
      const admins = await bot.api.getChatAdministrators(chat.id);
      const isAdmin = admins.some((admin) => admin.user.id.toString() === userId);
      const [details, members] = await Promise.all([chatInfo, chatMembers]);
      const avatar = await getChatAvatar(bot, details.photo?.small_file_id ?? '');
      const title = 'title' in details ? details.title : '';

      if (title !== chat.name) {
        const updatedChats = [...linkedChats];
        // eslint-disable-next-line security/detect-object-injection
        const updatedChat = { ...updatedChats[index], name: title || '$NO_TITLE' };

        updatedChats.splice(index, 1, updatedChat);
        const userSession = await redisService.getUserSession(userId);
        const chatsWitUpdates = { ...userSession, linkedChats: updatedChats } as Session;

        await redisService.setUserSession(userId, chatsWitUpdates);
      }

      const formattedChat: Required<Omit<ChatDetails, 'airAlarm'>> = {
        id: details.id.toString(),
        name: title || '$NO_TITLE',
        photo: avatar,
        users: members,
        isAdministrator: isAdmin,
      };

      return formattedChat;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error);
      }

      return deletedChat(chat.id, chat.name);
    }
  });

  return Promise.all(chats);
};
