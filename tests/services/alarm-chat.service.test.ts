import type { Message } from '@grammyjs/types';

import { chartMock, generateChatSessionData, generateMockSessions, testId } from '@services/_mocks/alarm.mocks';
import { alarmChatService } from '@services/alarm-chat.service';

import type { GrammyBot } from '@types/';

const apiMock: Partial<GrammyBot['api']> = {
  sendMessage: vi.fn(() => Promise.resolve({} as Partial<Message.TextMessage> as Message.TextMessage)),
  getChat: vi.fn(() => Promise.resolve(chartMock)),
  setChatPermissions: vi.fn(),
};

vi.mock('../../src/services/redis.service', () => ({
  redisService: {
    getChatSessions: () => generateMockSessions(),
    updateChatSession: () => null,
  },
}));

describe('AlarmChatService', () => {
  beforeAll(async () => {
    alarmChatService.processChatAlarm = vi.fn(alarmChatService.processChatAlarm);

    await alarmChatService.init(apiMock as GrammyBot['api']);
  });

  describe('getChatsWithAlarmModeOn', () => {
    it('should get sessions only with disableChatWhileAirRaidAlert', async () => {
      const sessions = await alarmChatService.getChatsWithAlarmModeOn();

      expect(sessions.length).toEqual(6);
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
