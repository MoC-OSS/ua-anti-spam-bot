import { alarmChatService } from './alarm-chat.service';
const {
  generateMockSessions,
  testId,
  testState,
  generateChatSessionData,
  getAlarmMock,
  chartMock,
  generateChat,
} = require('./_mocks/alarm.mocks');
import { alarmService, ALARM_EVENT_KEY } from './alarm.service';

const apiMock = {
  sendMessage: jest.fn(() => Promise.resolve(null)),
  getChat: jest.fn(() => chartMock),
  setChatPermissions: jest.fn(() => {}),
};

const redis = {
  redisService: {
    getChatSessions: async () => Promise.resolve(generateMockSessions()),
    updateChatSession: async () => Promise.resolve(null),
  },
};

jest.mock('./redis.service', () => redis);

describe('AlarmChatService', () => {
  beforeAll(() => {
    alarmChatService.processChatAlarm = jest.fn(alarmChatService.processChatAlarm);
    alarmChatService.init(apiMock);
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
      await alarmChatService.updateChat(session, testId);
      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(true));
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((r) => setTimeout(r, 3000));
      expect(alarmChatService.processChatAlarm).toHaveBeenCalledTimes(1);
      expect(alarmChatService.processChatAlarm).toHaveBeenCalledWith(chat, true);
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
