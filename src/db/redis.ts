import * as redis from 'redis';
import type { JsonObject, Primitive } from 'type-fest';

import { environmentConfig } from '../config';
import type { ChatSession, ChatSessionData, Session } from '../types';
import type { CustomJsonValue } from '../types/object';

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

export async function getRawValue<T>(key: string | null | undefined): Promise<T | null> {
  if (!key) return {} as T;
  try {
    const sourceSession = await client.get(key);
    return JSON.parse(sourceSession || '{}') as T;
  } catch {
    return null;
  }
}

export async function getValue<T>(key: string): Promise<T> {
  if (!key) return {} as T;
  try {
    const sourceSession = await client.get(key);
    return (JSON.parse(sourceSession || '{}') || {}) as T;
  } catch (error) {
    console.error(error);
    return {} as T;
  }
}

export function setRawValue(key: string, value: Primitive | CustomJsonValue | Session | ChatSessionData) {
  return client.set(key, JSON.stringify(value));
}

export function setValue(key: string, value: JsonObject) {
  if (!key || !value) return;

  return client.set(key, JSON.stringify(value));
}

export function removeKey(key: string) {
  if (!key) {
    return null;
  }

  return client.del(key);
}

export async function getAllUserKeys(): Promise<string[]> {
  const keys = await client.keys('*:*');
  return keys.filter((key) => redisSelectors.userSessions.test(key));
}

export async function getAllUserRecords(): Promise<Session[]> {
  const filteredKeys = await getAllUserKeys();
  const values = await client.mGet(filteredKeys);

  return values
    .map((value, index) => {
      try {
        return {
          id: filteredKeys[index],
          data: JSON.parse(value || '{}') as Session['data'],
        } as Session;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Session[];
}

export async function getAllChatRecords(): Promise<ChatSession[]> {
  const keys = await client.keys('*');
  const filteredKeys = keys.filter((key) => redisSelectors.chatSessions.test(key));
  const values = await client.mGet(filteredKeys);

  return values
    .map((value, index) => {
      try {
        return {
          id: filteredKeys[index],
          data: JSON.parse(value || '{}') as ChatSession['data'],
        } as ChatSession;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as ChatSession[];
}

export async function getAllRecords(): Promise<(Session | ChatSession)[]> {
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
            id: keys[index],
            data: JSON.parse(record || '{}') as Session['data'] & ChatSession['data'],
          } as Session & ChatSession;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as (Session & ChatSession)[];
  } catch (error) {
    console.error(error);
    return [];
  }
}
