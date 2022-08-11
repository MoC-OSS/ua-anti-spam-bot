const { alarmService, ALARM_EVENT_KEY } = require('./alarm.service');
const { redisService } = require('./redis.service');
const { getAlarmStartNotificationMessage, alarmEndNotificationMessage, chatIsMutedMessage, chatIsUnmutedMessage } = require('../message');
const { handleError } = require('../utils');

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

    return sessions.filter((s) => s.data.chatSettings?.airRaidAlertSettings?.disableChatWhileAirRaidAlert);
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
    let startAlarmMessage = '';
    let endAlarmMessage = '';

    if (chat.data.chatSettings.disableChatWhileAirRaidAlert) {
      startAlarmMessage += getAlarmStartNotificationMessage(chat.data.chatSettings);
      endAlarmMessage += alarmEndNotificationMessage;
    }
    if (chat.data.chatSettings.airRaidAlertSettings.notificationMessage) {
      startAlarmMessage += chatIsMutedMessage;
      endAlarmMessage += chatIsUnmutedMessage;
    }

    if (isAlarm) {
      const newSession = { ...chat, chatPermissions: chatInfo.permissions };
      await redisService.updateChatSession(chat.id, newSession);
      const newPermissions = {};
      this.api.setChatPermissions(chat.id, newPermissions);
      this.api.sendMessage(chat.id, startAlarmMessage, { parse_mode: 'HTML' }).catch(handleError);
    } else {
      const currentSession = await redisService.getChatSession(chat.id);
      const newPermissions = { ...currentSession.data.chatPermissions };
      this.api.setChatPermissions(chat.id, newPermissions);
      this.api.sendMessage(chat.id, endAlarmMessage, { parse_mode: 'HTML' }).catch(handleError);
    }
  }
}

const alarmChatService = new AlarmChatService();

module.exports = {
  alarmChatService,
};
