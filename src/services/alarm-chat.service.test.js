const { alarmChatService } = require('./alarm-chat.service');
const { apiMock, getMockSessions, testId, generateChatSession, getAlarmMock } = require('./_mocks/alarm.mocks');
const { alarmService, ALARM_EVENT_KEY } = require('./alarm.service');

const redis = {
  redisService: {
    getChatSessions: async () => Promise.resolve(getMockSessions()),
    updateChatSession: async () => Promise.resolve(null),
  },
};

jest.mock('./redis.service', () => redis);

describe('AlarmChatService', () => {
  beforeAll(() => {
    alarmChatService.processChatAlarm = jest.fn(alarmChatService.processChatAlarm);
    alarmChatService.init(apiMock);
  });

  describe('add and delete chats', () => {
    it('should add new chat to list', () => {
      const lengthBefore = alarmChatService.chats.length;
      const chat = generateChatSession(testId);
      alarmChatService.addOrUpdateChat(chat);
      expect(alarmChatService.chats.length).toEqual(lengthBefore + 1);
      expect(alarmChatService.chats[alarmChatService.chats.length - 1]).toEqual(chat);
    });
    it('should update current chat', () => {
      const lengthBefore = alarmChatService.chats.length;
      const chat = generateChatSession(testId);
      alarmChatService.addOrUpdateChat(chat);
      expect(alarmChatService.chats.length).toEqual(lengthBefore);
      expect(alarmChatService.chats[alarmChatService.chats.length - 1]).toEqual(chat);
    });

    it('delete existing chat', () => {
      const lengthBefore = alarmChatService.chats.length;
      const chat = generateChatSession(testId);
      alarmChatService.deleteChat(chat);
      expect(alarmChatService.chats.length).toEqual(lengthBefore - 1);
      expect(alarmChatService.chats[alarmChatService.chats.length - 1]).not.toEqual(chat);
    });
    it('do nothing if the chat is not found', () => {
      const lengthBefore = alarmChatService.chats.length;
      const chat = generateChatSession(testId);
      alarmChatService.deleteChat(chat);
      expect(alarmChatService.chats.length).toEqual(lengthBefore);
    });
  });

  describe('getChatsWithAlarmModeOn', () => {
    it('should get sessions only with disableChatWhileAirRaidAlert', async () => {
      const sessions = await alarmChatService.getChatsWithAlarmModeOn();
      expect(sessions.length).toEqual(3);
    });
  });

  describe('subscribeToAlarms', () => {
    it('should process alarm = true', async () => {
      alarmChatService.api.setChatPermissions = jest.fn(() => Promise.resolve(null));
      const chat = generateChatSession(testId, 'Львівська область');
      alarmChatService.addOrUpdateChat(chat);
      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(true));
      expect(alarmChatService.processChatAlarm).toHaveBeenCalledTimes(1);
      expect(alarmChatService.processChatAlarm).toHaveBeenCalledWith(chat, true);

      // expect(redis.redisService.updateChatSession).toBeCalled();
      // expect(alarmChatService.api.setChatPermissions).toHaveBeenCalledTimes(1);
    });
  });
});
