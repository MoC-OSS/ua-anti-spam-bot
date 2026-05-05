/**
 * @module alarm-chat.service
 * @description Manages air-raid alarm notifications for individual Telegram chats.
 * Sends start/end notifications and handles per-chat mute/unmute settings.
 */

import Bottleneck from 'bottleneck';
import pIteration from 'p-iteration';
import type { Chat } from 'typegram/manage';

import { alarmEndNotificationMessage, chatIsMutedMessage, chatIsUnmutedMessage, getAlarmStartNotificationMessage } from '@message';

import type { AlarmEvent } from '@app-types/alarm';
import type { GrammyBot } from '@app-types/context';
import type { ChatSession, ChatSessionData } from '@app-types/session';

import { handleError } from '@utils/error-handler.util';
import { logger } from '@utils/logger.util';

import { ALARM_EVENT_KEY, alarmService } from './alarm.service';
import { redisService } from './redis.service';

export class AlarmChatService {
  api!: GrammyBot['api'];

  chats: ChatSession[] = [];

  /** Set of regionIds that currently have active alarms. */
  activeAlarmRegionIds: Set<string> | undefined;

  limiter!: Bottleneck;

  async init(api: GrammyBot['api']) {
    this.api = api;
    this.chats = await this.getChatsWithAlarmModeOn();
    this.activeAlarmRegionIds = new Set();

    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 2000,
    });

    await this.syncActiveAlarms();
    this.subscribeToAlarms();
  }

  /**
   * Checks whether the given region currently has an active alarm.
   * @param regionId - the Stfalcon region identifier to check
   * @returns true if the region is currently under alarm
   */
  isAlarmNow(regionId: string): boolean {
    return this.activeAlarmRegionIds?.has(regionId) ?? false;
  }

  /**
   * Checks whether any of the given region IDs currently have an active alarm.
   * @param regionIds - array of Stfalcon region identifiers to check
   * @returns true if any of the regions are currently under alarm
   */
  isAnyAlarmNow(regionIds: string[]): boolean {
    return regionIds.some((id) => this.isAlarmNow(id));
  }

  /**
   * Updates or removes a chat from the alarm notification list based on its settings.
   * @param chatSession - the updated session data for the chat
   * @param id - the chat identifier to update or remove
   */
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

  /**
   * Synchronizes the active alarm state from the Stfalcon REST API.
   * Called once on startup to populate the initial alarm state.
   */
  async syncActiveAlarms() {
    const alerts = await alarmService.getAlerts();

    for (const region of alerts) {
      if (region.activeAlerts.length > 0) {
        this.activeAlarmRegionIds?.add(region.regionId);
      } else {
        this.activeAlarmRegionIds?.delete(region.regionId);
      }
    }
  }

  subscribeToAlarms() {
    alarmService.updatesEmitter.on(ALARM_EVENT_KEY, (event: AlarmEvent) => {
      const isRepeatedAlarm = this.isAlarmNow(event.regionId);

      if (event.alert) {
        this.activeAlarmRegionIds?.add(event.regionId);
      } else {
        this.activeAlarmRegionIds?.delete(event.regionId);
      }

      if (this.chats) {
        pIteration
          // eslint-disable-next-line unicorn/no-array-method-this-argument,unicorn/no-array-callback-reference
          .forEach(this.chats, async (chat) => {
            const subscribedRegionIds = chat.payload.chatSettings.airRaidAlertSettings.regionIds;

            if (subscribedRegionIds.includes(event.regionId)) {
              await this.limiter.schedule(() =>
                this.processChatAlarm(chat, event.alert, event.regionName, isRepeatedAlarm).catch(handleError),
              );
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
   * @param chat - the chat session to process the alarm for
   * @param isAlarm - true if alarm started, false if alarm ended
   * @param regionName - the Ukrainian region name for display in notifications
   * @param isRepeatedAlarm - true if this is a repeated alarm for the same region
   */
  async processChatAlarm(chat: ChatSession, isAlarm: boolean, regionName: string, isRepeatedAlarm = false) {
    const chatInfo = await this.api?.getChat(chat.id);
    let startAlarmMessage = '';
    let endAlarmMessage = '';

    if (chat.payload.chatSettings.airRaidAlertSettings.notificationMessage) {
      startAlarmMessage += getAlarmStartNotificationMessage(regionName, isRepeatedAlarm);
      endAlarmMessage += alarmEndNotificationMessage(regionName);
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
