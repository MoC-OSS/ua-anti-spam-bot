import type { ChatFullInfo } from 'grammy/types';

import type { AlarmNotification } from '@app-types/alarm';
import type { ChatSessionData } from '@app-types/session';

import { getRandomItem } from '@utils/generic.util';

import { generateRandomBoolean, generateRandomNumber, generateRandomString } from './helpers.mocks';

export const testId = 1_234_567_890;

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

export const chartMock: ChatFullInfo = {
  id: testId,
  type: 'supergroup',
  title: 'SuperMockChat',
  permissions: {
    can_send_messages: true,
    can_send_photos: true,
    can_send_polls: true,
    can_send_other_messages: true,
    can_add_web_page_previews: true,
    can_change_info: true,
    can_invite_users: true,
    can_pin_messages: true,
  },
  accent_color_id: 0,
  max_reaction_count: 1,
  accepted_gift_types: {
    unlimited_gifts: false,
    limited_gifts: false,
    unique_gifts: false,
    premium_subscription: false,
    gifts_from_channels: false,
  },
};

/**
 * Generates a mock ChatSessionData object for testing alarm scenarios.
 * @param state - the region/state name for air-raid alert settings
 * @param disableChatWhileAirRaidAlert - whether to disable chat during alerts
 * @param notificationMessage - whether to send a notification message on alarm
 * @returns a mock ChatSessionData object
 */
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
      can_send_photos: generateRandomBoolean(),
      can_send_polls: generateRandomBoolean(),
      can_send_other_messages: generateRandomBoolean(),
      can_add_web_page_previews: generateRandomBoolean(),
      can_change_info: generateRandomBoolean(),
      can_invite_users: generateRandomBoolean(),
      can_pin_messages: generateRandomBoolean(),
    },
  };
}

/**
 * Creates a mock chat record with an id and session payload.
 * @param id - numeric chat identifier
 * @param payload - session data to associate with the chat
 * @returns a chat object with stringified id and session payload
 */
export function generateChat(id: number, payload: ChatSessionData) {
  return { id: id.toString(), payload };
}

/**
 * Generates an array of mock chat sessions for testing alarm notification scenarios.
 * @param state - the region/state name used in alarm settings
 * @param disableChatWhileAirRaidAlertOn - number of chats with disableChatWhileAirRaidAlert enabled
 * @param notificationMessageOn - number of chats with notificationMessage enabled
 * @param bothOff - number of chats with both options disabled
 * @returns array of mock chat records covering all alarm setting combinations
 */
export function generateMockSessions(
  state = generateRandomString(10),
  disableChatWhileAirRaidAlertOn = 3,
  notificationMessageOn = 3,
  bothOff = 3,
) {
  const disableChatWhileAirRaidAlertOnArray = Array.from({ length: disableChatWhileAirRaidAlertOn }, () =>
    generateChat(generateRandomNumber(10), generateChatSessionData(state, true, false)),
  );

  const notificationMessageOnArray = Array.from({ length: notificationMessageOn }, () =>
    generateChat(generateRandomNumber(10), generateChatSessionData(state, false, true)),
  );

  const bothOffArray = Array.from({ length: bothOff }, () =>
    generateChat(generateRandomNumber(10), generateChatSessionData(state, false, false)),
  );

  return [...disableChatWhileAirRaidAlertOnArray, ...notificationMessageOnArray, ...bothOffArray];
}
