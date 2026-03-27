import type { Message } from '@grammyjs/types';

import {
  chartMock,
  generateChat,
  generateChatSessionData,
  generateMockSessions,
  getAlarmMock,
  testId,
  testState,
} from '@services/_mocks/alarm.mocks';
import { ALARM_EVENT_KEY, alarmService } from '@services/alarm.service';
import { alarmChatService } from '@services/alarm-chat.service';

import type { GrammyBot } from '@app-types/context';

const { updateChatSessionMock, getChatSessionMock } = vi.hoisted(() => ({
  updateChatSessionMock: vi.fn(() => null),
  getChatSessionMock: vi.fn(() => Promise.resolve(null)),
}));

const apiMock: Partial<GrammyBot['api']> = {
  sendMessage: vi.fn(() => Promise.resolve({} as Partial<Message.TextMessage> as Message.TextMessage)),
  getChat: vi.fn(() => Promise.resolve(chartMock)),
  setChatPermissions: vi.fn(),
};

vi.mock('../../src/services/redis.service', () => ({
  redisService: {
    getChatSessions: () => generateMockSessions(),
    updateChatSession: updateChatSessionMock,
    getChatSession: getChatSessionMock,
  },
}));

vi.mock('@services/stfalcon-alarm-api.service', () => ({
  stfalconAlarmApiService: {
    getAlerts: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@db/redis-pubsub', () => ({
  createAlarmSubscriber: vi.fn().mockResolvedValue({ disconnect: vi.fn() }),
  ALARM_CHANNEL: 'alarm:updates',
}));

vi.mock('@shared/config', () => ({
  environmentConfig: {
    DISABLE_ALARM_API: false,
    ALARM_KEY: 'test-key',
    ENV: 'test',
    REDIS_URL: 'redis://localhost:6379',
  },
}));

describe('AlarmChatService', () => {
  beforeAll(async () => {
    alarmChatService.processChatAlarm = vi.fn(alarmChatService.processChatAlarm);

    // init() now calls subscribeToAlarms() internally.
    await alarmChatService.init(apiMock as GrammyBot['api']);
  });

  // eslint-disable-next-line no-secrets/no-secrets
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
      expect(alarmChatService.chats.at(-1)).toEqual({ id: testId.toString(), payload: chat });
    });

    it('should update current chat', () => {
      const updateChatId = alarmChatService.chats[0].id;
      const lengthBefore = alarmChatService.chats.length;
      // console.log(alarmChatService.chats);
      const chat = generateChatSessionData();

      alarmChatService.updateChat(chat, updateChatId);
      // console.log(alarmChatService.chats);
      expect(alarmChatService.chats.length).toEqual(lengthBefore);
      expect(alarmChatService.chats[0]).toEqual({ id: updateChatId, payload: chat });
    });

    it('delete existing chat', () => {
      const updateChatId = alarmChatService.chats[0].id;
      const lengthBefore = alarmChatService.chats.length;
      const chat = generateChatSessionData('', false, false);

      alarmChatService.updateChat(chat, updateChatId);
      expect(alarmChatService.chats.length).toEqual(lengthBefore - 1);
      expect(alarmChatService.chats.at(-1)).not.toEqual({ id: updateChatId, payload: chat });
    });
  });

  describe('isAlarmNow', () => {
    it('should return true when state has an active alarm', () => {
      alarmChatService.alarms = new Set([testState]);
      expect(alarmChatService.isAlarmNow(testState)).toBe(true);
    });

    it('should return false when state has no active alarm', () => {
      alarmChatService.alarms = new Set();
      expect(alarmChatService.isAlarmNow(testState)).toBe(false);
    });
  });

  describe('getChatsWithAlarm', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should add state to alarms set when alert is true', async () => {
      vi.spyOn(alarmService, 'getStates').mockResolvedValue({
        states: [{ id: 1, name: testState, name_en: 'Test Region', alert: true, changed: new Date() }],
        last_update: new Date().toISOString(),
      });

      alarmChatService.alarms = new Set();

      await alarmChatService.getChatsWithAlarm();

      expect(alarmChatService.alarms?.has(testState)).toBe(true);
    });

    it('should remove state from alarms set when alert is false', async () => {
      vi.spyOn(alarmService, 'getStates').mockResolvedValue({
        states: [{ id: 1, name: testState, name_en: 'Test Region', alert: false, changed: new Date() }],
        last_update: new Date().toISOString(),
      });

      alarmChatService.alarms = new Set([testState]);

      await alarmChatService.getChatsWithAlarm();

      expect(alarmChatService.alarms?.has(testState)).toBe(false);
    });
  });

  describe('processChatAlarm', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      getChatSessionMock.mockResolvedValue(null);
    });

    it('should mute chat and send message when alarm=true, disableChatWhileAirRaidAlert=true, isBotAdmin=true', async () => {
      const chatData = generateChatSessionData(testState, true, false);

      chatData.isBotAdmin = true;
      const chat = generateChat(testId, chatData);

      await alarmChatService.processChatAlarm(chat, true, false);

      expect(updateChatSessionMock).toHaveBeenCalled();
      expect(apiMock.setChatPermissions).toHaveBeenCalledWith(chat.id, {});
      expect(apiMock.sendMessage).toHaveBeenCalledWith(chat.id, expect.any(String), { parse_mode: 'HTML' });
    });

    it('should not mute chat when alarm=true and isRepeatedAlarm=true', async () => {
      const chatData = generateChatSessionData(testState, true, false);

      chatData.isBotAdmin = true;
      const chat = generateChat(testId, chatData);

      await alarmChatService.processChatAlarm(chat, true, true);

      expect(updateChatSessionMock).not.toHaveBeenCalled();
      expect(apiMock.setChatPermissions).not.toHaveBeenCalled();
      expect(apiMock.sendMessage).toHaveBeenCalledWith(chat.id, expect.any(String), { parse_mode: 'HTML' });
    });

    it('should not mute chat when alarm=true and disableChatWhileAirRaidAlert=false', async () => {
      const chatData = generateChatSessionData(testState, false, true);

      chatData.isBotAdmin = true;
      const chat = generateChat(testId, chatData);

      await alarmChatService.processChatAlarm(chat, true, false);

      expect(updateChatSessionMock).not.toHaveBeenCalled();
      expect(apiMock.setChatPermissions).not.toHaveBeenCalled();
      expect(apiMock.sendMessage).toHaveBeenCalledWith(chat.id, expect.any(String), { parse_mode: 'HTML' });
    });

    it('should not set chat permissions when alarm=true and isBotAdmin=false', async () => {
      const chatData = generateChatSessionData(testState, true, false);

      chatData.isBotAdmin = false;
      const chat = generateChat(testId, chatData);

      await alarmChatService.processChatAlarm(chat, true, false);

      expect(updateChatSessionMock).toHaveBeenCalled();
      expect(apiMock.setChatPermissions).not.toHaveBeenCalled();
    });

    it('should unmute chat and send message when alarm=false, disableChatWhileAirRaidAlert=true, isBotAdmin=true', async () => {
      const chatData = generateChatSessionData(testState, true, false);

      chatData.isBotAdmin = true;
      const chat = generateChat(testId, chatData);

      getChatSessionMock.mockResolvedValue({ chatPermissions: { can_send_messages: true } } as any);

      await alarmChatService.processChatAlarm(chat, false);

      expect(getChatSessionMock).toHaveBeenCalledWith(chat.id);
      expect(apiMock.setChatPermissions).toHaveBeenCalledWith(chat.id, { can_send_messages: true });
      expect(apiMock.sendMessage).toHaveBeenCalledWith(chat.id, expect.any(String), { parse_mode: 'HTML' });
    });

    it('should not restore permissions when alarm=false and isBotAdmin=false', async () => {
      const chatData = generateChatSessionData(testState, true, false);

      chatData.isBotAdmin = false;
      const chat = generateChat(testId, chatData);

      await alarmChatService.processChatAlarm(chat, false);

      expect(getChatSessionMock).toHaveBeenCalledWith(chat.id);
      expect(apiMock.setChatPermissions).not.toHaveBeenCalled();
    });

    it('should not get session or set permissions when alarm=false and disableChatWhileAirRaidAlert=false', async () => {
      const chatData = generateChatSessionData(testState, false, true);

      chatData.isBotAdmin = true;
      const chat = generateChat(testId, chatData);

      await alarmChatService.processChatAlarm(chat, false);

      expect(getChatSessionMock).not.toHaveBeenCalled();
      expect(apiMock.setChatPermissions).not.toHaveBeenCalled();
      expect(apiMock.sendMessage).toHaveBeenCalledWith(chat.id, expect.any(String), { parse_mode: 'HTML' });
    });
  });

  describe('subscribeToAlarms', () => {
    let originalLimiter: typeof alarmChatService.limiter;
    let originalProcessChatAlarm: typeof alarmChatService.processChatAlarm;

    beforeEach(() => {
      originalLimiter = alarmChatService.limiter;
      originalProcessChatAlarm = alarmChatService.processChatAlarm;

      // Replace limiter with a direct executor to avoid 2000 ms minTime delays in tests
      alarmChatService.limiter = {
        schedule: (scheduledTask: () => Promise<unknown>) => scheduledTask(),
      } as typeof alarmChatService.limiter;

      alarmChatService.processChatAlarm = vi.fn(() => Promise.resolve());
      alarmChatService.alarms = new Set();
    });

    afterEach(() => {
      alarmChatService.limiter = originalLimiter;
      alarmChatService.processChatAlarm = originalProcessChatAlarm;
    });

    it('should call processChatAlarm for a chat whose state matches the alarm event', async () => {
      const chatData = generateChatSessionData(testState, true, true);
      const chat = generateChat(testId, chatData);

      alarmChatService.chats = [chat];

      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(true, testState));

      await vi.waitFor(() => {
        expect(alarmChatService.processChatAlarm).toHaveBeenCalledWith(chat, true, false);
      });
    });

    it('should pass isRepeatedAlarm=true when the state was already active', async () => {
      alarmChatService.alarms = new Set([testState]);
      const chatData = generateChatSessionData(testState, true, true);
      const chat = generateChat(testId, chatData);

      alarmChatService.chats = [chat];

      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(true, testState));

      await vi.waitFor(() => {
        expect(alarmChatService.processChatAlarm).toHaveBeenCalledWith(chat, true, true);
      });
    });

    it('should add state to alarms set when alert=true event is emitted', async () => {
      alarmChatService.chats = [];

      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(true, testState));

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(alarmChatService.alarms?.has(testState)).toBe(true);
    });

    it('should remove state from alarms set when alert=false event is emitted', async () => {
      alarmChatService.alarms = new Set([testState]);
      alarmChatService.chats = [];

      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(false, testState));

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(alarmChatService.alarms?.has(testState)).toBe(false);
    });

    it('should not call processChatAlarm for a chat whose state does not match the event', async () => {
      const chatData = generateChatSessionData('differentState', true, true);
      const chat = generateChat(testId, chatData);

      alarmChatService.chats = [chat];

      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(true, testState));

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(alarmChatService.processChatAlarm).not.toHaveBeenCalled();
    });
  });
});
