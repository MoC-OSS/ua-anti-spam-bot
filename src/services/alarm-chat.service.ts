import { GrammyBot } from '../types';

const Bottleneck = require('bottleneck');
const { alarmService, ALARM_EVENT_KEY } = require('./alarm.service');
const { redisService } = require('./redis.service');
const { getAlarmStartNotificationMessage, alarmEndNotificationMessage, chatIsMutedMessage, chatIsUnmutedMessage } = require('../message');
const { handleError } = require('../utils');

export class AlarmChatService {
  /**
   * @param {GrammyBot['api']} api
   * */
  api: GrammyBot['api'] | undefined;
  chats: any[] | undefined;
  alarms: Set<any> | undefined;
  limiter: typeof Bottleneck | undefined;
  async init(api) {
    this.api = api;
    this.chats = await this.getChatsWithAlarmModeOn();
    this.alarms = new Set([]);
    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 2000,
    });
    this.subscribeToAlarms();
  }

  /**
   * @param {state} string
   * @returns {boolean}
   * */
  isAlarmNow(state) {
    return this.alarms?.has(state);
  }

  /**
   * @param {ChatSessionData} chatSession
   * @param {string} id
   * */
  async updateChat(chatSession, id) {
    const chatId = id.toString();
    const index = this.chats?.findIndex((chat) => chat.id === chatId) || -1;
    if (index !== -1) {
      if (!chatSession.chatSettings.disableChatWhileAirRaidAlert && !chatSession.chatSettings.airRaidAlertSettings.notificationMessage) {
        this.chats?.splice(index, 1);
      } else {
        // @ts-ignore
        this.chats[index].data = chatSession;
      }
    } else if (chatSession.chatSettings.disableChatWhileAirRaidAlert || chatSession.chatSettings.airRaidAlertSettings.notificationMessage) {
      this.chats?.push({
        id: chatId,
        data: chatSession,
      });
    }
  }

  /**
   * @returns {Promise<ChatSession[]>}
   * */
  async getChatsWithAlarmModeOn() {
    const sessions = await redisService.getChatSessions();
    return sessions.filter(
      (s) => s.data.chatSettings?.airRaidAlertSettings?.notificationMessage || s.data.chatSettings?.disableChatWhileAirRaidAlert,
    );
  }

  subscribeToAlarms() {
    alarmService.updatesEmitter.on(ALARM_EVENT_KEY, (event) => {
      if (event.state.alert) {
        this.alarms?.add(event.state.name);
      } else {
        this.alarms?.delete(event.state.name);
      }
      this.chats?.forEach((chat) => {
        if (chat.data.chatSettings.airRaidAlertSettings.state === event.state.name) {
          this.limiter.schedule(() => {
            this.processChatAlarm(chat, event.state.alert).catch(handleError);
          });
        }
      });
    });
  }

  /**
   * @param {ChatSession} chat
   * @param {boolean} isAlarm
   * */
  async processChatAlarm(chat, isAlarm) {
    const chatInfo = await this.api?.getChat(chat.id);
    let startAlarmMessage = '';
    let endAlarmMessage = '';

    if (chat.data.chatSettings.airRaidAlertSettings.notificationMessage) {
      startAlarmMessage += getAlarmStartNotificationMessage(chat.data.chatSettings);
      endAlarmMessage += alarmEndNotificationMessage(chat.data.chatSettings);
    }
    if (chat.data.chatSettings.disableChatWhileAirRaidAlert) {
      startAlarmMessage += chatIsMutedMessage;
      endAlarmMessage += chatIsUnmutedMessage;
    }

    if (isAlarm) {
      if (chat.data.chatSettings.disableChatWhileAirRaidAlert) {
        const newSession = { ...chat.data };
        newSession.chatPermissions = { ...(chatInfo as any).permissions };
        await redisService.updateChatSession(chat.id, newSession);
        const newPermissions = {};
        await this.api?.setChatPermissions(chat.id, newPermissions);
      }
      this.api?.sendMessage(chat.id, startAlarmMessage, { parse_mode: 'HTML' }).catch(handleError);
    } else {
      if (chat.data.chatSettings.disableChatWhileAirRaidAlert) {
        const currentSession = await redisService.getChatSession(chat.id);
        const newPermissions = { ...currentSession.chatPermissions };
        await this.api?.setChatPermissions(chat.id, newPermissions);
      }
      this.api?.sendMessage(chat.id, endAlarmMessage, { parse_mode: 'HTML' }).catch(handleError);
    }
  }
}

export const alarmChatService = new AlarmChatService();

module.exports = {
  alarmChatService,
};
