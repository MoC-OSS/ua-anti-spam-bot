import axios from 'axios';
import type { Bot } from 'grammy';

import { environmentConfig } from '../config';
import { redisService } from '../services';
import type { ChatDetails, GrammyContext, LinkedChat, Session } from '../types';

export const getUserIdFromAuthorizationHeader = (authorizationHeader: string | undefined): string => {
  const userIdParameter: string = new URLSearchParams(authorizationHeader).get('user') || '';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  return JSON.parse(userIdParameter).id.toString() as string;
};

export const getLinkedChats = async (userId: string) => {
  const userSessions = await redisService.getUserSession(userId);
  return userSessions?.linkedChats || [];
};

export const getChatAvatar = async (filePath: string | undefined) => {
  if (!filePath) return '';
  try {
    const arrayBuffer = await axios.get<Buffer>(`https://api.telegram.org/file/bot${environmentConfig.BOT_TOKEN}/${filePath}`, {
      responseType: 'arraybuffer',
    });
    const avatar = arrayBuffer.data.toString('base64');
    return `data:image/jpeg;base64, ${avatar}`;
  } catch (error) {
    console.info(error, 'SSSSSSSSSS');
    return '';
  }
};

const deletedChat = (id: string, name: string) => ({ id, name, photo: '', users: 0, isAdministrator: false });
export const updateChatsList = async (linkedChats: LinkedChat[], bot: Bot<GrammyContext>, userId: string) => {
  const chats = linkedChats.map(async (chat: LinkedChat, index: number) => {
    try {
      const chatInfo = await bot.api.getChat(chat.id);
      const chatMembers = await bot.api.getChatMemberCount(chat.id);
      const admins = await bot.api.getChatAdministrators(chat.id);
      const isAdmin = admins.some((admin) => admin.user.id.toString() === userId);
      const [info, members] = await Promise.all([chatInfo, chatMembers]);
      const photo = await bot.api.getFile(info.photo?.small_file_id ?? '');
      const avatar = await getChatAvatar(photo.file_path);
      const title = 'title' in info ? info.title : '';

      if (title !== chat.name) {
        const updatedChats = [...linkedChats];
        const updatedChat = { ...updatedChats[index], name: title };
        updatedChats.splice(index, 1, updatedChat);
        const userSession = await redisService.getUserSession(userId);
        const chatsWitUpdates = { ...userSession, linkedChats: updatedChats } as Session;
        await redisService.setUserSession(userId, chatsWitUpdates);
      }

      const formattedChat: Required<ChatDetails> = {
        id: info.id.toString(),
        name: title,
        photo: avatar,
        users: members,
        isAdministrator: isAdmin,
      };

      return formattedChat;
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
        return deletedChat(chat.id, chat.name);
      }
    }
  });

  return Promise.all(chats);
};
