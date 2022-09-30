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

const apiMock = {
  sendMessage: jest.fn(() => Promise.resolve(null)),
  getChat: jest.fn(() => chartMock),
  setChatPermissions: jest.fn(),
};

const redis = {
  redisService: {
    getChatSessions: () => generateMockSessions(),
    updateChatSession: () => null,
  },
};

jest.mock('./redis.service', () => redis);

describe('AlarmChatService', () => {
  beforeAll(async () => {
    alarmChatService.processChatAlarm = jest.fn(alarmChatService.processChatAlarm.bind(this));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await alarmChatService.init(apiMock as any);
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
      expect(alarmChatService.processChatAlarm.bind(this)).toHaveBeenCalledTimes(1);
      expect(alarmChatService.processChatAlarm.bind(this)).toHaveBeenCalledWith(chat, true);
    });
  });

  describe('add and delete chats', () => {
    it('should add new chat to list', () => {
      alarmChatService.chats = [];
      const lengthBefore = alarmChatService.chats.length;
      const chat = generateChatSessionData();
      alarmChatService.updateChat(chat, testId);
      expect(alarmChatService.chats.length).toEqual(lengthBefore + 1);
      expect(alarmChatService.chats[alarmChatService.chats.length - 1]).toEqual({ id: testId, data: chat });
    });
    it('should update current chat', () => {
      const lengthBefore = alarmChatService.chats.length;
      const chat = generateChatSessionData();
      alarmChatService.updateChat(chat, testId);
      expect(alarmChatService.chats.length).toEqual(lengthBefore);
      expect(alarmChatService.chats[alarmChatService.chats.length - 1]).toEqual({ id: testId, data: chat });
    });
    it('delete existing chat', () => {
      const lengthBefore = alarmChatService.chats.length;
      const chat = generateChatSessionData('', false, false);
      alarmChatService.updateChat(chat, testId);
      expect(alarmChatService.chats.length).toEqual(lengthBefore - 1);
      expect(alarmChatService.chats[alarmChatService.chats.length - 1]).not.toEqual({ id: testId, data: chat });
    });
  });
});
