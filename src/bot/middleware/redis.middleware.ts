import type { NextFunction } from 'grammy';
import type { JsonObject } from 'type-fest';

import { redisClient } from '../../db';
import type { GrammyContext, RedisSessionOptions } from '../../types';

export class RedisMiddleware {
  constructor(private options: RedisSessionOptions) {}

  getSessionKey(context: GrammyContext): string {
    return this.options.getSessionKey(context);
  }

  getSession(key: string): Promise<JsonObject> {
    return redisClient.getValue(key);
  }

  saveSession(key: string, data: JsonObject) {
    return redisClient.setValue(key, data);
  }

  middleware(property = this.options.property) {
    return async (context: GrammyContext, next: NextFunction) => {
      const key = this.getSessionKey(context);
      if (!key) return next();
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
    };
  }
}
