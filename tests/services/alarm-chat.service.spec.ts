import type { Message } from '@grammyjs/types';

import {
  chartMock,
  generateChat,
  generateChatSessionData,
  generateMockSessions,
  getAlarmEventMock,
  testId,
  testRegionId,
  testRegionName,
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
      const chat = generateChatSessionData();

      alarmChatService.updateChat(chat, updateChatId);
      expect(alarmChatService.chats.length).toEqual(lengthBefore);
      expect(alarmChatService.chats[0]).toEqual({ id: updateChatId, payload: chat });
    });

    it('delete existing chat', () => {
      const updateChatId = alarmChatService.chats[0].id;
      const lengthBefore = alarmChatService.chats.length;
      const chat = generateChatSessionData([], false, false);

      alarmChatService.updateChat(chat, updateChatId);
      expect(alarmChatService.chats.length).toEqual(lengthBefore - 1);
      expect(alarmChatService.chats.at(-1)).not.toEqual({ id: updateChatId, payload: chat });
    });
  });

  describe('isAlarmNow', () => {
    it('should return true when regionId has an active alarm', () => {
      alarmChatService.activeAlarmRegionIds = new Set([testRegionId]);
      expect(alarmChatService.isAlarmNow(testRegionId)).toBe(true);
    });

    it('should return false when regionId has no active alarm', () => {
      alarmChatService.activeAlarmRegionIds = new Set();
      expect(alarmChatService.isAlarmNow(testRegionId)).toBe(false);
    });
  });

  describe('syncActiveAlarms', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should add regionId to active set when alert is active', async () => {
      vi.spyOn(alarmService, 'getAlerts').mockResolvedValue([
        {
          regionId: testRegionId,
          regionName: testRegionName,
          regionEngName: 'Lviv Oblast',
          regionType: 'State',
          lastUpdate: new Date().toISOString(),
          activeAlerts: [{ regionId: testRegionId, regionType: 'State', type: 'AIR', lastUpdate: new Date().toISOString() }],
        },
      ]);

      alarmChatService.activeAlarmRegionIds = new Set();

      await alarmChatService.syncActiveAlarms();

      expect(alarmChatService.activeAlarmRegionIds?.has(testRegionId)).toBe(true);
    });

    it('should remove regionId from active set when alert is not active', async () => {
      vi.spyOn(alarmService, 'getAlerts').mockResolvedValue([
        {
          regionId: testRegionId,
          regionName: testRegionName,
          regionEngName: 'Lviv Oblast',
          regionType: 'State',
          lastUpdate: new Date().toISOString(),
          activeAlerts: [],
        },
      ]);

      alarmChatService.activeAlarmRegionIds = new Set([testRegionId]);

      await alarmChatService.syncActiveAlarms();

      expect(alarmChatService.activeAlarmRegionIds?.has(testRegionId)).toBe(false);
    });
  });

  describe('processChatAlarm', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      getChatSessionMock.mockResolvedValue(null);
    });

    it('should mute chat and send message when alarm=true, disableChatWhileAirRaidAlert=true, isBotAdmin=true', async () => {
      const chatData = generateChatSessionData([testRegionId], true, false);

      chatData.isBotAdmin = true;
      const chat = generateChat(testId, chatData);

      await alarmChatService.processChatAlarm(chat, true, testRegionName, false);

      expect(updateChatSessionMock).toHaveBeenCalled();
      expect(apiMock.setChatPermissions).toHaveBeenCalledWith(chat.id, {});
      expect(apiMock.sendMessage).toHaveBeenCalledWith(chat.id, expect.any(String), { parse_mode: 'HTML' });
    });

    it('should not mute chat when alarm=true and isRepeatedAlarm=true', async () => {
      const chatData = generateChatSessionData([testRegionId], true, false);

      chatData.isBotAdmin = true;
      const chat = generateChat(testId, chatData);

      await alarmChatService.processChatAlarm(chat, true, testRegionName, true);

      expect(updateChatSessionMock).not.toHaveBeenCalled();
      expect(apiMock.setChatPermissions).not.toHaveBeenCalled();
      expect(apiMock.sendMessage).toHaveBeenCalledWith(chat.id, expect.any(String), { parse_mode: 'HTML' });
    });

    it('should not mute chat when alarm=true and disableChatWhileAirRaidAlert=false', async () => {
      const chatData = generateChatSessionData([testRegionId], false, true);

      chatData.isBotAdmin = true;
      const chat = generateChat(testId, chatData);

      await alarmChatService.processChatAlarm(chat, true, testRegionName, false);

      expect(updateChatSessionMock).not.toHaveBeenCalled();
      expect(apiMock.setChatPermissions).not.toHaveBeenCalled();
      expect(apiMock.sendMessage).toHaveBeenCalledWith(chat.id, expect.any(String), { parse_mode: 'HTML' });
    });

    it('should not set chat permissions when alarm=true and isBotAdmin=false', async () => {
      const chatData = generateChatSessionData([testRegionId], true, false);

      chatData.isBotAdmin = false;
      const chat = generateChat(testId, chatData);

      await alarmChatService.processChatAlarm(chat, true, testRegionName, false);

      expect(updateChatSessionMock).toHaveBeenCalled();
      expect(apiMock.setChatPermissions).not.toHaveBeenCalled();
    });

    it('should unmute chat and send message when alarm=false, disableChatWhileAirRaidAlert=true, isBotAdmin=true', async () => {
      const chatData = generateChatSessionData([testRegionId], true, false);

      chatData.isBotAdmin = true;
      const chat = generateChat(testId, chatData);

      getChatSessionMock.mockResolvedValue({ chatPermissions: { can_send_messages: true } } as any);

      await alarmChatService.processChatAlarm(chat, false, testRegionName);

      expect(getChatSessionMock).toHaveBeenCalledWith(chat.id);
      expect(apiMock.setChatPermissions).toHaveBeenCalledWith(chat.id, { can_send_messages: true });
      expect(apiMock.sendMessage).toHaveBeenCalledWith(chat.id, expect.any(String), { parse_mode: 'HTML' });
    });

    it('should not restore permissions when alarm=false and isBotAdmin=false', async () => {
      const chatData = generateChatSessionData([testRegionId], true, false);

      chatData.isBotAdmin = false;
      const chat = generateChat(testId, chatData);

      await alarmChatService.processChatAlarm(chat, false, testRegionName);

      expect(getChatSessionMock).toHaveBeenCalledWith(chat.id);
      expect(apiMock.setChatPermissions).not.toHaveBeenCalled();
    });

    it('should not get session or set permissions when alarm=false and disableChatWhileAirRaidAlert=false', async () => {
      const chatData = generateChatSessionData([testRegionId], false, true);

      chatData.isBotAdmin = true;
      const chat = generateChat(testId, chatData);

      await alarmChatService.processChatAlarm(chat, false, testRegionName);

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
      alarmChatService.activeAlarmRegionIds = new Set();
    });

    afterEach(() => {
      alarmChatService.limiter = originalLimiter;
      alarmChatService.processChatAlarm = originalProcessChatAlarm;
    });

    it('should call processChatAlarm for a chat whose regionIds match the alarm event', async () => {
      const chatData = generateChatSessionData([testRegionId], true, true);
      const chat = generateChat(testId, chatData);

      alarmChatService.chats = [chat];

      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmEventMock(true, testRegionId, testRegionName));

      await vi.waitFor(() => {
        expect(alarmChatService.processChatAlarm).toHaveBeenCalledWith(chat, true, testRegionName, false);
      });
    });

    it('should pass isRepeatedAlarm=true when the regionId was already active', async () => {
      alarmChatService.activeAlarmRegionIds = new Set([testRegionId]);
      const chatData = generateChatSessionData([testRegionId], true, true);
      const chat = generateChat(testId, chatData);

      alarmChatService.chats = [chat];

      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmEventMock(true, testRegionId, testRegionName));

      await vi.waitFor(() => {
        expect(alarmChatService.processChatAlarm).toHaveBeenCalledWith(chat, true, testRegionName, true);
      });
    });

    it('should add regionId to active set when alert=true event is emitted', async () => {
      alarmChatService.chats = [];

      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmEventMock(true, testRegionId, testRegionName));

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(alarmChatService.activeAlarmRegionIds?.has(testRegionId)).toBe(true);
    });

    it('should remove regionId from active set when alert=false event is emitted', async () => {
      alarmChatService.activeAlarmRegionIds = new Set([testRegionId]);
      alarmChatService.chats = [];

      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmEventMock(false, testRegionId, testRegionName));

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(alarmChatService.activeAlarmRegionIds?.has(testRegionId)).toBe(false);
    });

    it('should not call processChatAlarm for a chat whose regionIds do not match the event', async () => {
      const chatData = generateChatSessionData(['999'], true, true);
      const chat = generateChat(testId, chatData);

      alarmChatService.chats = [chat];

      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmEventMock(true, testRegionId, testRegionName));

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(alarmChatService.processChatAlarm).not.toHaveBeenCalled();
    });
  });
});
