import type { ChatFromGetChat } from '@grammyjs/types/manage';

import type { AlarmNotification, ChatSessionData } from '../../types';
import { getRandomItem } from '../../utils';
import type { RedisService } from '../redis.service';

import { generateRandomBoolean, generateRandomNumber, generateRandomString } from './helpers.mocks';

export const testId = '1234567890';
export const testState = 'Львівська область';
export const generateTestState = (state = testState) => ({
  id: generateRandomNumber(3),
  name: state,
  name_en: generateRandomBoolean(),
  alert: false,
  changed: generateRandomString(10),
});

export const getAlarmMock = (alert = false, state = testState): AlarmNotification => ({
  state: {
    alert,
    id: generateRandomNumber(2),
    name: state,
    name_en: generateRandomString(10),
    changed: new Date(),
  },
  notification_id: generateRandomString(10),
});

export const chartMock = {
  id: +testId,
  permissions: {
    can_send_media_messages: true,
    can_send_polls: true,
    can_send_other_messages: true,
    can_add_web_page_previews: true,
    can_change_info: true,
    can_invite_users: true,
    can_pin_messages: true,
  },
} as Partial<ChatFromGetChat>;

export function generateChatSessionData(
  state = generateRandomString(10),
  disableChatWhileAirRaidAlert = true,
  notificationMessage = true,
): ChatSessionData {
  return {
    chatType: getRandomItem(['channel', 'channel', 'supergroup', 'group']),
    chatMembersCount: generateRandomNumber(10),
    botRemoved: generateRandomBoolean(),
    isBotAdmin: generateRandomBoolean(),
    botAdminDate: new Date(),
    chatSettings: {
      disableStrategicInfo: generateRandomBoolean(),
      disableDeleteMessage: generateRandomBoolean(),
      disableSwindlerMessage: generateRandomBoolean(),
      disableChatWhileAirRaidAlert,
      airRaidAlertSettings: {
        notificationMessage,
        state,
        pageNumber: generateRandomNumber(1),
      },
    },
    chatPermissions: {
      can_send_messages: generateRandomBoolean(),
      can_send_media_messages: generateRandomBoolean(),
      can_send_polls: generateRandomBoolean(),
      can_send_other_messages: generateRandomBoolean(),
      can_add_web_page_previews: generateRandomBoolean(),
      can_change_info: generateRandomBoolean(),
      can_invite_users: generateRandomBoolean(),
      can_pin_messages: generateRandomBoolean(),
    },
  };
}

export function generateChat(id: string, data: ChatSessionData) {
  return { id, data };
}

export function generateMockSessions(
  state = generateRandomString(10),
  disableChatWhileAirRaidAlertOn = 3,
  notificationMessageOn = 3,
  bothOff = 3,
) {
  const disableChatWhileAirRaidAlertOnArray = Array.from({ length: disableChatWhileAirRaidAlertOn }, () =>
    generateChat(generateRandomString(10), generateChatSessionData(state, true, false)),
  );
  const notificationMessageOnArray = Array.from({ length: notificationMessageOn }, () =>
    generateChat(generateRandomString(10), generateChatSessionData(state, false, true)),
  );
  const bothOffArray = Array.from({ length: bothOff }, () =>
    generateChat(generateRandomString(10), generateChatSessionData(state, false, false)),
  );
  return [...disableChatWhileAirRaidAlertOnArray, ...notificationMessageOnArray, ...bothOffArray];
}

export const redisMock = {
  redisService: {
    getChatSessions: () => Promise.resolve({ records: generateMockSessions(), keys: [] }),
    updateChatSession: () => Promise.resolve(null),
  } as Partial<RedisService>,
};
