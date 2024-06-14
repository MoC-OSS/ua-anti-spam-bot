import type { Message } from '@grammyjs/types';

import type { GrammyBot } from '../types';
import { sleep } from '../utils';

import {
  chartMock,
  generateChat,
  generateChatSessionData,
  generateMockSessions,
  getAlarmMock,
  testId,
  testState,
} from './_mocks/alarm.mocks';
import { ALARM_EVENT_KEY, alarmService } from './alarm.service';
import { alarmChatService } from './alarm-chat.service';

const apiMock: Partial<GrammyBot['api']> = {
  sendMessage: jest.fn(() => Promise.resolve({} as Partial<Message.TextMessage> as Message.TextMessage)),
  getChat: jest.fn(() => Promise.resolve(chartMock)),
  setChatPermissions: jest.fn(),
};

jest.mock('./redis.service', () => ({
  redisService: {
    getChatSessions: () => generateMockSessions(),
    updateChatSession: () => null,
  },
}));

describe('AlarmChatService', () => {
  beforeAll(async () => {
    alarmChatService.processChatAlarm = jest.fn(alarmChatService.processChatAlarm);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await alarmChatService.init(apiMock as GrammyBot['api']);
  });

  describe('getChatsWithAlarmModeOn', () => {
    it('should get sessions only with disableChatWhileAirRaidAlert', async () => {
      const sessions = await alarmChatService.getChatsWithAlarmModeOn();
      expect(sessions.length).toEqual(6);
    });
  });

  describe('subscribeToAlarms', () => {
    it('should process alarm = true', async () => {
      const session = generateChatSessionData(testState, true, true);
      const chat = generateChat(testId, session);
      alarmChatService.updateChat(session, testId);
      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(true));
      // eslint-disable-next-line no-promise-executor-return
      await sleep(3000);
      expect(alarmChatService.processChatAlarm).toHaveBeenCalledTimes(1);
      // TODO FIX THIS test
      expect(alarmChatService.processChatAlarm).toHaveBeenCalledWith(chat, true, true);
    });
  });

  describe('add and delete chats', () => {
    it('should add new chat to list', () => {
      alarmChatService.chats = [];
      const lengthBefore = alarmChatService.chats.length;
      const chat = generateChatSessionData();
      alarmChatService.updateChat(chat, testId);
      expect(alarmChatService.chats.length).toEqual(lengthBefore + 1);
      expect(alarmChatService.chats.at(-1)).toEqual({ id: testId.toString(), data: chat });
    });

    it('should update current chat', () => {
      const updateChatId = alarmChatService.chats[0].id;
      const lengthBefore = alarmChatService.chats.length;
      // console.log(alarmChatService.chats);
      const chat = generateChatSessionData();
      alarmChatService.updateChat(chat, updateChatId);
      // console.log(alarmChatService.chats);
      expect(alarmChatService.chats.length).toEqual(lengthBefore);
      expect(alarmChatService.chats[0]).toEqual({ id: updateChatId, data: chat });
    });

    it('delete existing chat', () => {
      const updateChatId = alarmChatService.chats[0].id;
      const lengthBefore = alarmChatService.chats.length;
      const chat = generateChatSessionData('', false, false);
      alarmChatService.updateChat(chat, updateChatId);
      expect(alarmChatService.chats.length).toEqual(lengthBefore - 1);
      expect(alarmChatService.chats.at(-1)).not.toEqual({ id: updateChatId, data: chat });
    });
  });
});
