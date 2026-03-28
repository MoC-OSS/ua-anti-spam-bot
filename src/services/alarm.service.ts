/**
 * @module alarm.service
 * @description Consumes air-raid alert events from the Redis pub/sub alarm channel and
 * exposes them to the rest of the bot via a typed event emitter.
 *
 * The server process receives alarm webhooks from the Stfalcon API and publishes
 * {@link AlarmPubSubMessage} objects to the Redis channel. This service subscribes to
 * that channel and re-emits notifications as {@link AlarmEvent} objects so that
 * {@link AlarmChatService} (and any other listener) can react to alarm state changes
 * without being coupled to the transport mechanism.
 */

import { EventEmitter } from 'node:events';

import ms from 'ms';
import type TypedEmitter from 'typed-emitter';

import { createAlarmSubscriber } from '@db/redis-pubsub';

import { environmentConfig } from '@shared/config';

import type { AlarmEvent } from '@app-types/alarm';
import type { AlarmPubSubMessage, StfalconRegionAlert } from '@app-types/stfalcon-alarm';

import { logger } from '@utils/logger.util';

import { getAlarmEventMock } from './_mocks/alarm.mocks';
import { stfalconAlarmApiService } from './stfalcon-alarm-api.service';

export const ALARM_CONNECT_KEY = 'connect';

export const ALARM_CLOSE_KEY = 'close';

export const ALARM_EVENT_KEY = 'update';

export const TEST_ALARM_REGION_ID = '0';

export const TEST_ALARM_REGION_NAME = 'Московська область';

export interface UpdatesEvents {
  connect: (reason: string) => void;
  close: (reason: string) => void;
  update: (body: AlarmEvent) => void;
}

/**
 * Maps a {@link AlarmPubSubMessage} from the Redis channel to the internal
 * {@link AlarmEvent} shape consumed by {@link AlarmChatService}.
 * @param message - The raw pub/sub message received from Redis.
 * @returns The corresponding {@link AlarmEvent}.
 */
function mapPubSubMessageToAlarmEvent(message: AlarmPubSubMessage): AlarmEvent {
  return {
    regionId: message.regionId,
    regionName: message.regionName,
    alert: message.alert,
    alertType: message.alertType,
    lastUpdate: message.lastUpdate,
  };
}

export class AlarmService {
  // @ts-expect-error — EventEmitter lacks generic overload but TypedEmitter satisfies it at runtime.
  // eslint-disable-next-line unicorn/prefer-event-target
  updatesEmitter = new EventEmitter() as TypedEmitter<UpdatesEvents>;

  testAlarmInterval?: ReturnType<typeof setInterval>;

  private redisSubscriber?: Awaited<ReturnType<typeof createAlarmSubscriber>>;

  /**
   * Fetches the current alert status for all regions from the Stfalcon REST API.
   * @returns Array of {@link StfalconRegionAlert} objects with current alert status.
   */
  async getAlerts(): Promise<StfalconRegionAlert[]> {
    if (environmentConfig.DISABLE_ALARM_API) {
      return [];
    }

    try {
      return await stfalconAlarmApiService.getAlerts();
    } catch (error) {
      logger.error(error, 'Failed to fetch alarm states from Stfalcon API');

      return [];
    }
  }

  /**
   * Starts listening for alarm events on the Redis pub/sub channel.
   * Each received message is mapped to an {@link AlarmEvent} and emitted on
   * {@link updatesEmitter} so that downstream listeners (e.g. {@link AlarmChatService})
   * are notified.
   * @param reason - Human-readable reason for enabling (used for logging).
   */
  async enable(reason: string): Promise<void> {
    if (environmentConfig.DISABLE_ALARM_API) {
      logger.info(`Alarm service: skipping enable (DISABLE_ALARM_API=true). Reason: ${reason}`);

      return;
    }

    await this.subscribeToRedisChannel(reason);
    this.updatesEmitter.emit(ALARM_CONNECT_KEY, reason);
  }

  /**
   * Closes the Redis pub/sub subscription and emits a close event.
   * @param reason - Human-readable reason for disabling.
   */
  async disable(reason: string): Promise<void> {
    if (this.redisSubscriber) {
      // eslint-disable-next-line sonarjs/deprecation
      await this.redisSubscriber.disconnect().catch((error: unknown) => {
        logger.error(error, 'Error disconnecting alarm Redis subscriber');
      });

      this.redisSubscriber = undefined;
      this.updatesEmitter.emit(ALARM_CLOSE_KEY, reason);
    }

    if (this.testAlarmInterval) {
      clearInterval(this.testAlarmInterval);
      this.testAlarmInterval = undefined;
    }
  }

  /**
   * Restarts the Redis subscription.
   */
  async restart(): Promise<void> {
    await this.disable('restart');
    await this.enable('restart');
  }

  /**
   * Creates a Redis subscriber that listens on the alarm channel and emits events
   * on {@link updatesEmitter} for each received message.
   * @param reason - Passed to the connect event for observability.
   */
  async subscribeToRedisChannel(reason: string): Promise<void> {
    if (this.redisSubscriber) {
      // eslint-disable-next-line sonarjs/deprecation
      await this.redisSubscriber.disconnect().catch((error: unknown) => {
        logger.error(error, 'Error disconnecting previous alarm Redis subscriber');
      });

      this.redisSubscriber = undefined;
    }

    this.redisSubscriber = await createAlarmSubscriber((rawMessage) => {
      try {
        const message = JSON.parse(rawMessage) as AlarmPubSubMessage;
        const event = mapPubSubMessageToAlarmEvent(message);

        this.updatesEmitter.emit(ALARM_EVENT_KEY, event);
      } catch (error) {
        logger.error(error, 'Alarm service: failed to parse pub/sub message');
      }
    });

    logger.info(`Alarm service: Redis subscription active. Reason: ${reason}`);
  }

  /**
   * Emits simulated alarm toggle events every 30 seconds.
   * Intended for local development and staging tests where a real webhook is unavailable.
   */
  initTestAlarms(): void {
    let isAlert = true;

    this.testAlarmInterval = setInterval(() => {
      this.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmEventMock(isAlert, TEST_ALARM_REGION_ID, TEST_ALARM_REGION_NAME));
      isAlert = !isAlert;
    }, ms('0.5m'));
  }
}

export const alarmService = new AlarmService();
