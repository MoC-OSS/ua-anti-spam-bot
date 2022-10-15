import * as redis from 'redis';
import type { JsonObject, JsonValue, Primitive } from 'type-fest';

import { environmentConfig } from '../config';
import type { ChatSession, Session } from '../types';

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

export function setRawValue(key: string, value: Primitive | JsonValue) {
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
