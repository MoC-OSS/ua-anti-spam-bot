/**
 * @module redis-pubsub
 * @description Dedicated Redis pub/sub clients for the alarm notification channel.
 *
 * Redis v4 requires separate client connections for pub/sub subscribers — a
 * subscribing client cannot issue regular commands. This module exposes factory
 * functions for creating isolated publisher and subscriber clients.
 */

import * as redis from 'redis';

import { environmentConfig } from '@shared/config';

import { logger } from '@utils/logger.util';

/** The Redis pub/sub channel used to broadcast alarm state changes from the server to the bot. */
export const ALARM_CHANNEL = 'alarm:updates';

/**
 * Creates and connects a dedicated Redis client for publishing alarm events.
 * The caller is responsible for disconnecting this client on shutdown.
 * @returns A connected Redis client suitable for `publish` calls.
 */
export async function createAlarmPublisher() {
  const publisher = redis.createClient({ url: environmentConfig.REDIS_URL });

  publisher.on('error', (error) => {
    logger.error('Alarm Redis publisher error:', error);
  });

  await publisher.connect();
  logger.info('Alarm Redis publisher connected.');

  return publisher;
}

/**
 * Creates and connects a dedicated Redis client for subscribing to alarm events.
 * The subscriber is immediately registered on the {@link ALARM_CHANNEL}.
 * The caller is responsible for disconnecting this client on shutdown.
 * @param handler - Callback invoked with the raw JSON string of each {@link AlarmPubSubMessage}.
 * @returns A connected Redis client with an active subscription.
 */
export async function createAlarmSubscriber(handler: (message: string) => void) {
  const subscriber = redis.createClient({ url: environmentConfig.REDIS_URL });

  subscriber.on('error', (error) => {
    logger.error('Alarm Redis subscriber error:', error);
  });

  await subscriber.connect();
  await subscriber.subscribe(ALARM_CHANNEL, handler);
  logger.info(`Alarm Redis subscriber connected and listening on channel "${ALARM_CHANNEL}".`);

  return subscriber;
}
