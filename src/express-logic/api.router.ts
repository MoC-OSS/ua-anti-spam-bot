import type { Request, Response } from 'express';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import type { Bot } from 'grammy';

import { alarmChatService, alarmService, redisService } from '../services';
import type { ChatData, ChatSettings, GrammyContext, Session } from '../types';

import { getChatAvatar, getLinkedChats, getUserIdFromAuthorizationHeader, updateChatsList } from './helpers';
import { headersMiddleware, validateMiddleware } from './middleware';

export const apiRouter = (bot: Bot<GrammyContext>) => {
  const botRoute = Router();
  botRoute.use(headersMiddleware);
  botRoute.use(validateMiddleware);

  botRoute.get(
    '/chats',
    asyncHandler(async (request: Request, response: Response) => {
      const userId = getUserIdFromAuthorizationHeader(request.headers.authorization);
      const linkedChats = await getLinkedChats(userId);
      if (linkedChats.length === 0) response.status(200).json({ chats: [] });
      const chats = await updateChatsList(linkedChats, bot, userId);
      response.status(200).json({ chats });
    }),
  );

  botRoute.get(
    '/chats/:id',
    asyncHandler(async (request: Request, response: Response) => {
      response.setHeader('Cache-Control', 'no-store');
      const { id } = request.params;
      const defaultSettings: Required<ChatSettings> = {
        disableChatWhileAirRaidAlert: false,
        disableStrategicInfo: false,
        disableDeleteMessage: false,
        disableSwindlerMessage: false,
        disableDeleteServiceMessage: false,
        disableNsfwFilter: false,
        disableDeleteAntisemitism: false,
        enableDeleteCards: false,
        enableDeleteUrls: false,
        enableDeleteCounteroffensive: false,
        enableDeleteLocations: false,
        enableDeleteMentions: false,
        enableDeleteForwards: false,
        enableDeleteRussian: false,
        enableWarnRussian: false,
        enableDeleteObscene: false,
        enableDeleteDenylist: false,
        enableWarnObscene: false,
        denylist: [],
        enableAdminCheck: false,
        enableDeleteChannelMessages: false,
        airRaidAlertSettings: {
          pageNumber: 0,
          state: '',
          notificationMessage: false,
        },
      };
      const airRaidAlarmStates = await alarmService.getStates();
      const chatInfo = await bot.api.getChat(id);
      const chatMembers = await bot.api.getChatMemberCount(id);
      const chatSession = await redisService.getChatSession(id);
      const avatar = await getChatAvatar(bot, chatInfo.photo?.small_file_id ?? '');
      const title = 'title' in chatInfo ? chatInfo.title : '';
      const state = chatSession?.chatSettings?.airRaidAlertSettings?.state ?? '';
      const isAirAlarmNow = alarmChatService.isAlarmNow(state) || false;
      const data: Required<ChatData> = {
        chat: {
          id: chatInfo.id.toString(),
          name: title || '$NO_TITLE',
          photo: avatar,
          users: chatMembers,
          airAlarm: isAirAlarmNow,
        },
        settings: { ...defaultSettings, ...chatSession?.chatSettings },
        states: airRaidAlarmStates.states,
      };

      response.status(200).json({ ...data });
    }),
  );

  botRoute.put(
    '/settings',
    asyncHandler(async (request: Request, response: Response) => {
      const { id, settings } = request.body as { id: string; settings: ChatSettings };
      await redisService.updateChatSettings(id, settings);
      response.status(200).json({ message: `Data with ID ${id} has been updated successfully.` });
    }),
  );

  botRoute.delete(
    '/chats/:id',
    asyncHandler(async (request: Request, response: Response) => {
      const { id } = request.params;
      const userId = getUserIdFromAuthorizationHeader(request.headers.authorization);
      const userSession = await redisService.getUserSession(userId);
      const chats = userSession?.linkedChats || [];
      const newChatsList = chats.filter((chat) => chat.id.toString() !== id);
      const newData = { ...userSession, linkedChats: [...newChatsList] } as Session;
      await redisService.setUserSession(userId, newData);

      response.status(200).json({ message: 'Сhat successfully deleted.' });
    }),
  );

  return botRoute;
};
