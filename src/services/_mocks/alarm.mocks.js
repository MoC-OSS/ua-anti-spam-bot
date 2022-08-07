const { generateRandomNumber, generateRandomString, generateRandomBoolean } = require('./helpers.mocks');

const testId = '1234567890';

const getAlarmMock = (alert = false) => ({
  state: {
    alert,
    id: 12,
    name: 'Львівська область',
    name_en: 'Lviv oblast',
    changed: '2022-04-05T06:14:56+03:00',
  },
  notification_id: 'b7b5cb85-ddc0-11ec-90d3-c8b29b63332d',
});

const chartMock = {
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

const apiMock = {
  sendMessage: jest.fn(() => Promise.resolve(null)),
  getChat: jest.fn(() => chartMock),
  setChatPermissions: jest.fn(() => {}),
};

function generateChatSession(
  id = generateRandomString(10),
  chatAlarmLocation = generateRandomString(10),
  disableChatWhileAirRaidAlert = true,
) {
  return {
    id,
    data: {
      chatType: generateRandomString(10),
      chatMembersCount: generateRandomNumber(10),
      botRemoved: generateRandomBoolean(),
      isBotAdmin: generateRandomBoolean(),
      botAdminDate: new Date(),
      chatSettings: {
        disableStrategicInfo: generateRandomBoolean(),
        disableDeleteMessage: generateRandomBoolean(),
        disableSwindlerMessage: generateRandomBoolean(),
        airRaidAlertSettings: {
          disableChatWhileAirRaidAlert,
          chatAlarmLocation,
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
    },
  };
}

function getMockSessions(alarmModeOnLength = 3, alarmModeOffLength = 3) {
  const alarmModeOn = Array.from({ length: alarmModeOnLength }, () =>
    generateChatSession(generateRandomString(10), generateRandomString(10), true),
  );
  const alarmModeOff = Array.from({ length: alarmModeOffLength }, () =>
    generateChatSession(generateRandomString(10), generateRandomString(10), false),
  );
  return [...alarmModeOn, ...alarmModeOff];
}

module.exports = {
  getAlarmMock,
  apiMock,
  getMockSessions,
  generateChatSession,
  testId,
  chartMock,
};
