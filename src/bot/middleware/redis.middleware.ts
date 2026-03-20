import type { NextFunction } from 'grammy';

import type { JsonObject } from 'type-fest';

import * as redisClient from '@db/redis.client';

import type { GrammyContext } from '@app-types/context';
import type { RedisSessionOptions } from '@app-types/session';

/**
 * Provides Redis-backed session management for grammY.
 * Loads the session before downstream middleware and persists it after `next()` completes.
 */
export class RedisMiddleware {
  constructor(private options: RedisSessionOptions) {}

  /**
   * Derives the Redis key for the current chat session.
   * @param context - The Grammy context object
   * @returns The Redis key string for the current session
   */
  getSessionKey(context: GrammyContext): string {
    return this.options.getSessionKey(context);
  }

  /**
   * Retrieves a session object from Redis by key.
   * @param key - The Redis key to retrieve
   * @returns A promise resolving to the session object
   */
  getSession(key: string): Promise<JsonObject> {
    return redisClient.getValue(key);
  }

  /**
   * Persists the session object to Redis.
   * @param key - The Redis key to save under
   * @param payload - The session data to persist
   * @returns A promise that resolves when the session is saved
   */
  saveSession(key: string, payload: JsonObject) {
    return redisClient.setValue(key, payload);
  }

  /**
   * Returns the grammY middleware that loads and saves the session around downstream handlers.
   * @param property - The context property name to attach the session to
   * @returns A grammY middleware function
   */
  middleware(property = this.options.property) {
    return async (context: GrammyContext, next: NextFunction) => {
      const key = this.getSessionKey(context);

      if (!key) {
        return next();
      }

      let session = await this.getSession(key);

      Object.defineProperty(context, property, {
        get() {
          return session;
        },
        set(newValue: JsonObject) {
          session = { ...newValue };
        },
      });

      // Saving session object on the next middleware
      await next();
      await this.saveSession(key, session);

      // eslint-disable-next-line unicorn/no-useless-undefined
      return undefined;
    };
  }
}
