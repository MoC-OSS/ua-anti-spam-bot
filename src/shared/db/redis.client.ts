/**
 * @module redis.client
 * @description Low-level Redis client wrapper. Manages the connection lifecycle,
 * provides typed selector constants, and exposes get/set helpers for sessions and JSON data.
 */

import * as redis from 'redis';
import type { JsonObject, Primitive } from 'type-fest';

import { environmentConfig } from '@shared/config';

import type { CustomJsonValue } from '@app-types/object';
import type { ChatSession, ChatSessionData, Session } from '@app-types/session';

import { logger } from '@utils/logger.util';

export const redisSelectors = {
  isBotDeactivated: 'isBotDeactivated',
  botTensorPercent: 'botTensorPercent',
  swindlersStatistic: 'swindlersStatistic',
  positives: 'training:positives',
  negatives: 'training:negatives',
  trainingChatWhitelist: 'training:chatWhiteList',
  trainingStartRank: 'training:startRank',
  trainingTempMessages: 'training:tempMessages',
  trainingBots: 'training:bots',
  userSessions: /^-?\d+:-?\d+$/,
  chatSessions: /^-?\d+$/,
};

export const client = redis.createClient({ url: environmentConfig.REDIS_URL });

/**
 * Retrieves and parses a raw JSON value from Redis by key, returning null on failure.
 * @param key - The Redis key to fetch
 * @returns The parsed value of type T, or null if the key is missing or parsing fails
 */
export async function getRawValue<T>(key: string | null | undefined): Promise<T | null> {
  if (!key) {
    return {} as T;
  }

  try {
    const sourceSession = await client.get(key);

    return JSON.parse(sourceSession || '{}') as T;
  } catch {
    return null;
  }
}

/**
 * Retrieves and parses a JSON value from Redis by key, returning an empty object on failure.
 * @param key - The Redis key to fetch
 * @returns The parsed value of type T, or an empty object if the key is missing or parsing fails
 */
export async function getValue<T>(key: string): Promise<T> {
  if (!key) {
    return {} as T;
  }

  try {
    const sourceSession = await client.get(key);

    return (JSON.parse(sourceSession || '{}') || {}) as T;
  } catch (error) {
    logger.error(error);

    return {} as T;
  }
}

/**
 * Serializes and stores a raw value in Redis under the given key.
 * @param key - The Redis key to set
 * @param value - The value to serialize and store
 * @returns A promise that resolves when the value has been stored
 */
export function setRawValue(key: string, value: ChatSessionData | CustomJsonValue | Primitive | Session) {
  return client.set(key, JSON.stringify(value));
}

/**
 * Serializes and stores a JSON object in Redis under the given key, skipping empty inputs.
 * @param key - The Redis key to set
 * @param value - The JSON object to serialize and store
 * @returns A promise that resolves when the value has been stored, or undefined if inputs are empty
 */
export function setValue(key: string, value: JsonObject) {
  if (!key || !value) {
    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  }

  return client.set(key, JSON.stringify(value));
}

/**
 * Deletes a Redis key.
 * @param key - The Redis key to remove
 * @returns A promise resolving to the number of keys deleted, or null if no key was provided
 */
export function removeKey(key: string) {
  if (!key) {
    return null;
  }

  return client.del(key);
}

/**
 * Returns all Redis keys that match the user session key pattern (userId:chatId).
 * @returns A promise resolving to an array of matching user session key strings
 */
export async function getAllUserKeys(): Promise<string[]> {
  const keys = await client.keys('*:*');

  if (keys.length === 0) {
    return [];
  }

  return keys.filter((key) => redisSelectors.userSessions.test(key));
}

/**
 * Retrieves all user session records from Redis as parsed Session objects.
 * @returns A promise resolving to an array of Session objects for all user sessions
 */
export async function getAllUserRecords(): Promise<Session[]> {
  const filteredKeys = await getAllUserKeys();
  const values = await client.mGet(filteredKeys);

  return values
    .map((value, index) => {
      try {
        return {
          // eslint-disable-next-line security/detect-object-injection
          id: filteredKeys[index],
          payload: JSON.parse(value || '{}') as Session['payload'],
        } as unknown as Session;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Session[];
}

/**
 * Retrieves all chat session records from Redis as parsed ChatSession objects.
 * @returns A promise resolving to an array of ChatSession objects for all chat sessions
 */
export async function getAllChatRecords(): Promise<ChatSession[]> {
  const keys = await client.keys('*');

  if (keys.length === 0) {
    return [];
  }

  const filteredKeys = keys.filter((key) => redisSelectors.chatSessions.test(key));
  const values = await client.mGet(filteredKeys);

  return values
    .map((value, index) => {
      try {
        return {
          // eslint-disable-next-line security/detect-object-injection
          id: filteredKeys[index],
          payload: JSON.parse(value || '{}') as ChatSession['payload'],
        } as unknown as ChatSession;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as ChatSession[];
}

/**
 * Retrieves all records from Redis, including both user and chat sessions.
 * @returns A promise resolving to an array of all Session and ChatSession records
 */
export async function getAllRecords(): Promise<(ChatSession | Session)[]> {
  try {
    const keys = await client.keys('*');
    const sourceRecords = await Promise.all(keys.map((key) => client.get(key)));

    return sourceRecords
      .map((record, index) => {
        if (!record) {
          return null;
        }

        try {
          return {
            // eslint-disable-next-line security/detect-object-injection
            id: keys[index],
            payload: JSON.parse(record || '{}') as Session['payload'] & ChatSession['payload'],
          } as unknown as Session & ChatSession;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as (Session & ChatSession)[];
  } catch (error) {
    logger.error(error);

    return [];
  }
}
