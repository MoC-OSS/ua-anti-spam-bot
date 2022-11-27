import * as redis from 'redis';
import type { JsonObject, Primitive } from 'type-fest';

import { environmentConfig } from '../config';
import type { ChatSession, Session } from '../types';
import type { CustomJsonValue } from '../types/object';

export const client = redis.createClient({ url: environmentConfig.REDIS_URL });

export const redisSelectors = {
  isBotDeactivated: 'isBotDeactivated',
  botTensorPercent: 'botTensorPercent',
  positives: 'training:positives',
  negatives: 'training:negatives',
  trainingChatWhitelist: 'training:chatWhiteList',
  trainingStartRank: 'training:startRank',
  trainingTempMessages: 'training:tempMessages',
  trainingBots: 'training:bots',
  userSessions: /^-?\d+:-?\d+$/,
  chatSessions: /^-?\d+$/,
};

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

export function setRawValue(key: string, value: Primitive | CustomJsonValue) {
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

export async function getAllRecordsByKeys<T extends Session | ChatSession = Session | ChatSession>(keys: string[]): Promise<T[]> {
  try {
    const sourceRecords = await client.mGet(keys);
    return sourceRecords
      .map((record, index) => {
        if (!record) {
          return null;
        }

        try {
          return {
            id: keys[index],
            data: JSON.parse(record || '{}') as T['data'],
          } as T;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as T[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getAllRecords(): Promise<(Session | ChatSession)[]> {
  const keys = await client.keys('*');
  return getAllRecordsByKeys(keys);
}

export async function getAllUserRecords(): Promise<Session[]> {
  const keys = await client.keys('*');
  const validKeys = keys.filter((key) => redisSelectors.userSessions.test(key));
  return getAllRecordsByKeys(validKeys);
}

export async function getAllChatRecords() {
  const keys = await client.keys('*');
  const validKeys = keys.filter((key) => redisSelectors.chatSessions.test(key));
  const records: ChatSession[] = await getAllRecordsByKeys(validKeys);

  return {
    records,
    keys,
  };
}
