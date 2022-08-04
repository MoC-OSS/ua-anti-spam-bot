const { alarmService, ALARM_EVENT_KEY } = require('./alarm.service');
const { redisService } = require('./redis.service');
const { alarmStartMessage, alarmEndMessage, alarmStartNotificationMessage, alarmEndNotificationMessage } = require('../message');

class AlarmChatService {
  /**
   * @param {GrammyBot['api']} api
   * */
  async init(api) {
    this.api = api;
    this.chats = await this.getChatsWithAlarmModeOn();
    this.subscribeToAlarms();
  }

  /**
   * @param {ChatSession} chatSession
   * */
  addOrUpdateChat(chatSession) {
    const index = this.chats.findIndex((chat) => chat.id === chatSession.id);
    if (~index) {
      this.chats[index] = chatSession;
    } else {
      this.chats.push(chatSession);
    }
  }

  /**
   * @param {ChatSession} chatSession
   * */
  deleteChat(chatSession) {
    const index = this.chats.findIndex((chat) => chat.id === chatSession.id);
    if (~index) {
      this.chats.splice(index, 1);
    }
  }

  /**
   * @returns {Promise<ChatSession[]>}
   * */
  async getChatsWithAlarmModeOn() {
    let sessions = await redisService.getChatSessions();

    // mock, delete later
    sessions = sessions.map((s) => {
      if (s.id === '-774112991' || s.id === '-694504354') {
        return {
          id: s.id,
          data: {
            ...s.data,
            chatSettings: {
              airRaidAlertSettings: {
                disableChatWhileAirRaidAlert: true,
                state: 'Львівська область',
              },
            },
          },
        };
      }
      return s;
    });

    return sessions.filter(
      (s) => s.data.chatSettings?.airRaidAlertSettings?.notificationMessage || s.data.chatSettings?.disableChatWhileAirRaidAlert,
    );
  }

  subscribeToAlarms() {
    alarmService.updatesEmitter.on(ALARM_EVENT_KEY, (event) => {
      const affectedChats = this.chats.filter((chat) => chat.data.chatSettings.airRaidAlertSettings.state === event.state.name);
      affectedChats.forEach(async (chat) => {
        await this.processChatAlarm(chat, event.state.alert);
      });
    });
  }

  /**
   * @param {ChatSession} chat
   * @param {boolean} isAlarm
   * */
  async processChatAlarm(chat, isAlarm) {
    const chatInfo = await this.api.getChat(chat.id);

    // need to complete this:?
    if (isAlarm && chat.data.chatSettings.airRaidAlertSettings.notificationMessage) {
      this.api.sendMessage(chat.id, alarmStartNotificationMessage, { parse_mode: 'HTML' });
    } else {
      this.api.sendMessage(chat.id, alarmEndNotificationMessage, { parse_mode: 'HTML' });
    }

    if (isAlarm) {
      const newSession = { ...chat, chatPermissions: chatInfo.permissions };
      await redisService.updateChatSession(chat.id, newSession);
      const newPermissions = {};
      this.api.setChatPermissions(chat.id, newPermissions);
      this.api.sendMessage(chat.id, alarmStartMessage, { parse_mode: 'HTML' });
    } else {
      const currentSession = await redisService.getChatSession(chat.id);
      const newPermissions = { ...currentSession.data.chatPermissions };
      this.api.setChatPermissions(chat.id, newPermissions);
      this.api.sendMessage(chat.id, alarmEndMessage, { parse_mode: 'HTML' });
    }
  }
}

const alarmChatService = new AlarmChatService();

module.exports = {
  alarmChatService,
};
