export const { generateRandomNumber, generateRandomString, generateRandomBoolean } = require('./helpers.mocks');

export const testId = '1234567890';
export const testState = 'Львівська область';
export const generateTestState = (state = testState) => ({
  id: generateRandomNumber(3),
  name: state,
  name_en: generateRandomBoolean(),
  alert: false,
  changed: generateRandomString(10),
});

export const getAlarmMock = (alert = false, state = testState) => ({
  state: {
    alert,
    id: generateRandomNumber(2),
    name: state,
    name_en: generateRandomString(10),
    changed: generateRandomString(10),
  },
  notification_id: generateRandomString(10),
});

export const chartMock = {
  id: testId,
  permissions: {
    can_send_messages: true,
    can_send_media_messages: true,
    can_send_polls: true,
    can_send_other_messages: true,
    can_add_web_page_previews: true,
    can_change_info: true,
    can_invite_users: true,
    can_pin_messages: true,
  },
};

export function generateChatSessionData(state = generateRandomString(10), disableChatWhileAirRaidAlert = true, notificationMessage = true) {
  return {
    chatType: generateRandomString(10),
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

export function generateChat(id, data) {
  return { id, data };
}

export function generateMockSessions(
  state = generateRandomString(10),
  disableChatWhileAirRaidAlertOn = 3,
  notificationMessageOn = 3,
  bothOff = 3,
) {
  const disableChatWhileAirRaidAlertOnArr = Array.from({ length: disableChatWhileAirRaidAlertOn }, () =>
    generateChat(generateRandomString(10), generateChatSessionData(state, true, false)),
  );
  const notificationMessageOnArr = Array.from({ length: notificationMessageOn }, () =>
    generateChat(generateRandomString(10), generateChatSessionData(state, false, true)),
  );
  const bothOffArr = Array.from({ length: bothOff }, () =>
    generateChat(generateRandomString(10), generateChatSessionData(state, false, false)),
  );
  return [...disableChatWhileAirRaidAlertOnArr, ...notificationMessageOnArr, ...bothOffArr];
}

module.exports = {
  getAlarmMock,
  generateMockSessions,
  generateChatSessionData,
  generateChat,
  generateTestState,
  testId,
  testState,
  chartMock,
};
