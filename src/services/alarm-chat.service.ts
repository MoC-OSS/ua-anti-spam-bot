/**
 * @module alarm-chat.service
 * @description Manages air-raid alarm notifications for individual Telegram chats.
 * Sends start/end notifications and handles per-chat mute/unmute settings.
 */

import Bottleneck from 'bottleneck';
import pIteration from 'p-iteration';
import type { Chat } from 'typegram/manage';

import { alarmEndNotificationMessage, chatIsMutedMessage, chatIsUnmutedMessage, getAlarmStartNotificationMessage } from '@message';

import type { GrammyBot } from '@app-types/context';
import type { ChatSession, ChatSessionData } from '@app-types/session';

import { handleError } from '@utils/error-handler.util';
import { logger } from '@utils/logger.util';

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
    this.alarms = new Set();

    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 2000,
    });

    await this.getChatsWithAlarm();
    this.subscribeToAlarms();
  }

  /**
   * Checks whether the given region currently has an active alarm.
   * @param {string} state
   * @returns {boolean}
   * */
  isAlarmNow(state: string) {
    return this.alarms?.has(state);
  }

  /**
   * Updates or removes a chat from the alarm notification list based on its settings.
   * @param {ChatSessionData} chatSession
   * @param {string} id
   * */
  updateChat(chatSession: ChatSessionData, id: number | string | undefined) {
    if (!id) {
      throw new Error('This is an invalid chat id');
    }

    const chatId = id.toString();
    const index = this.chats ? this.chats.findIndex((chat) => chat.id === chatId) : -1;

    if (index !== -1) {
      if (!chatSession.chatSettings.disableChatWhileAirRaidAlert && !chatSession.chatSettings.airRaidAlertSettings.notificationMessage) {
        this.chats?.splice(index, 1);
      } else {
        // eslint-disable-next-line security/detect-object-injection
        this.chats[index].payload = chatSession;
      }
    } else if (chatSession.chatSettings.disableChatWhileAirRaidAlert || chatSession.chatSettings.airRaidAlertSettings.notificationMessage) {
      this.chats?.push({
        id: chatId,
        payload: chatSession,
      });
    }
  }

  async getChatsWithAlarmModeOn() {
    const sessions = await redisService.getChatSessions();

    return sessions.filter(
      (session) =>
        session.payload.chatSettings?.airRaidAlertSettings?.notificationMessage ||
        session.payload.chatSettings?.disableChatWhileAirRaidAlert,
    );
  }

  async getChatsWithAlarm() {
    const airRaidAlarmStates = await alarmService.getStates();

    airRaidAlarmStates.states.forEach((state) => {
      if (state.alert) {
        this.alarms?.add(state.name);
      } else {
        this.alarms?.delete(state.name);
      }
    });
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
        pIteration
          // eslint-disable-next-line unicorn/no-array-method-this-argument,unicorn/no-array-callback-reference
          .forEach(this.chats, async (chat) => {
            if (chat.payload.chatSettings.airRaidAlertSettings.state === event.state.name) {
              await this.limiter.schedule(() => this.processChatAlarm(chat, event.state.alert, isRepeatedAlarm).catch(handleError));
            }
          })
          .catch((error) => {
            logger.error('Error while scheduling the limiter', error);
          });
      }
    });
  }

  /**
   * Processes an alarm event for a chat, sending notifications and toggling chat permissions.
   * @param {ChatSession} chat
   * @param {boolean} isAlarm
   * @param isRepeatedAlarm
   * */
  async processChatAlarm(chat: ChatSession, isAlarm: boolean, isRepeatedAlarm = false) {
    const chatInfo = await this.api?.getChat(chat.id);
    let startAlarmMessage = '';
    let endAlarmMessage = '';

    if (chat.payload.chatSettings.airRaidAlertSettings.notificationMessage) {
      startAlarmMessage += getAlarmStartNotificationMessage(chat.payload.chatSettings, isRepeatedAlarm);
      endAlarmMessage += alarmEndNotificationMessage(chat.payload.chatSettings);
    }

    if (chat.payload.chatSettings.disableChatWhileAirRaidAlert) {
      startAlarmMessage += chatIsMutedMessage();
      endAlarmMessage += chatIsUnmutedMessage();
    }

    if (isAlarm) {
      if (chat.payload.chatSettings.disableChatWhileAirRaidAlert && !isRepeatedAlarm) {
        const newSession = { ...chat.payload, chatPermissions: { ...(chatInfo as Chat.MultiUserGetChat).permissions } };

        await redisService.updateChatSession(chat.id, newSession);
        const newPermissions = {};

        if (chat.payload.isBotAdmin) {
          await this.api?.setChatPermissions(chat.id, newPermissions);
        }
      }

      this.api?.sendMessage(chat.id, startAlarmMessage, { parse_mode: 'HTML' }).catch(handleError);
    } else {
      if (chat.payload.chatSettings.disableChatWhileAirRaidAlert) {
        const currentSession = await redisService.getChatSession(chat.id);
        const newPermissions = { ...currentSession?.chatPermissions };

        if (chat.payload.isBotAdmin) {
          await this.api?.setChatPermissions(chat.id, newPermissions);
        }
      }

      this.api?.sendMessage(chat.id, endAlarmMessage, { parse_mode: 'HTML' }).catch(handleError);
    }
  }
}

export const alarmChatService = new AlarmChatService();
