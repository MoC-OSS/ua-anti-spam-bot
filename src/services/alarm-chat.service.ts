import Bottleneck from 'bottleneck';
import { forEach } from 'p-iteration';
import type { Chat } from 'typegram/manage';

import { alarmEndNotificationMessage, chatIsMutedMessage, chatIsUnmutedMessage, getAlarmStartNotificationMessage } from '../message';
import type { ChatSession, ChatSessionData, GrammyBot } from '../types';
import { handleError } from '../utils';

import { ALARM_EVENT_KEY, alarmService } from './alarm.service';
import { redisService } from './redis.service';

export class AlarmChatService {
  api!: GrammyBot['api'];

  chats: ChatSession[] = [];

  alarms: Set<string> | undefined;

  limiter!: Bottleneck;

  async init(api: GrammyBot['api']) {
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
   * @param {string} state
   * @returns {boolean}
   * */
  isAlarmNow(state: string) {
    return this.alarms?.has(state);
  }

  /**
   * @param {ChatSessionData} chatSession
   * @param {string} id
   * */
  updateChat(chatSession: ChatSessionData, id: number | string | undefined) {
    if (!id) {
      throw new Error(`This is an invalid chat id`);
    }
    const chatId = id.toString();
    const index = this.chats ? this.chats.findIndex((chat) => chat.id === chatId) : -1;
    if (index !== -1) {
      if (!chatSession.chatSettings.disableChatWhileAirRaidAlert && !chatSession.chatSettings.airRaidAlertSettings.notificationMessage) {
        this.chats?.splice(index, 1);
      } else {
        this.chats[index].data = chatSession;
      }
    } else if (chatSession.chatSettings.disableChatWhileAirRaidAlert || chatSession.chatSettings.airRaidAlertSettings.notificationMessage) {
      this.chats?.push({
        id: chatId,
        data: chatSession,
      });
    }
  }

  async getChatsWithAlarmModeOn() {
    const sessions = await redisService.getChatSessions();
    return sessions.filter(
      (s) => s.data.chatSettings?.airRaidAlertSettings?.notificationMessage || s.data.chatSettings?.disableChatWhileAirRaidAlert,
    );
  }

  subscribeToAlarms() {
    alarmService.updatesEmitter.on(ALARM_EVENT_KEY, (event) => {
      const isRepeatedAlarm = this.isAlarmNow(event.state.name);

      if (event.state.alert) {
        this.alarms?.add(event.state.name);
      } else {
        this.alarms?.delete(event.state.name);
      }

      if (this.chats) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        forEach(this.chats, async (chat) => {
          if (chat.data.chatSettings.airRaidAlertSettings.state === event.state.name) {
            await this.limiter.schedule(() => this.processChatAlarm(chat, event.state.alert, isRepeatedAlarm).catch(handleError));
          }
        }).catch((error) => {
          console.error('Error while scheduling the limiter', error);
        });
      }
    });
  }

  /**
   * @param {ChatSession} chat
   * @param {boolean} isAlarm
   * @param isRepeatedAlarm
   * */
  async processChatAlarm(chat: ChatSession, isAlarm: boolean, isRepeatedAlarm = false) {
    const chatInfo = await this.api?.getChat(chat.id);
    let startAlarmMessage = '';
    let endAlarmMessage = '';

    if (chat.data.chatSettings.airRaidAlertSettings.notificationMessage) {
      startAlarmMessage += getAlarmStartNotificationMessage(chat.data.chatSettings, isRepeatedAlarm);
      endAlarmMessage += alarmEndNotificationMessage(chat.data.chatSettings);
    }
    if (chat.data.chatSettings.disableChatWhileAirRaidAlert) {
      startAlarmMessage += chatIsMutedMessage;
      endAlarmMessage += chatIsUnmutedMessage;
    }

    if (isAlarm) {
      if (chat.data.chatSettings.disableChatWhileAirRaidAlert && !isRepeatedAlarm) {
        const newSession = { ...chat.data };
        newSession.chatPermissions = { ...(chatInfo as Chat.MultiUserGetChat).permissions };
        await redisService.updateChatSession(chat.id, newSession);
        const newPermissions = {};

        if (chat.data.isBotAdmin) {
          await this.api?.setChatPermissions(chat.id, newPermissions);
        }
      }

      this.api?.sendMessage(chat.id, startAlarmMessage, { parse_mode: 'HTML' }).catch(handleError);
    } else {
      if (chat.data.chatSettings.disableChatWhileAirRaidAlert) {
        const currentSession = await redisService.getChatSession(chat.id);
        const newPermissions = { ...currentSession?.chatPermissions };

        if (chat.data.isBotAdmin) {
          await this.api?.setChatPermissions(chat.id, newPermissions);
        }
      }

      this.api?.sendMessage(chat.id, endAlarmMessage, { parse_mode: 'HTML' }).catch(handleError);
    }
  }
}

export const alarmChatService = new AlarmChatService();
