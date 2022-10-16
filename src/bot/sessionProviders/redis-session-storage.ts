import { redisClient } from '../../db';
import { GrammyContext } from '../../types';

export class RedisSession {
  options: any;

  constructor() {
    this.options = {
      property: 'session',
      state: {},
      format: {},
      getSessionKey: (context: GrammyContext) => {
        if (!context.from) return; // should never happen
        let chatInstance;
        if (context.chat) {
          chatInstance = context.chat.id;
        } else if (context.updateType === 'callback_query') {
          chatInstance = context.callbackQuery?.chat_instance;
        } else {
          chatInstance = context.from.id;
        }
        return `${chatInstance}:${context.from.id}`;
      },
    };
  }

  getSessionKey(context) {
    return this.options.getSessionKey(context);
  }

  getSession(key) {
    return redisClient.getValue(key);
  }

  saveSession(key, data) {
    return redisClient.setValue(key, data);
  }

  middleware(property = this.options.property) {
    const that = this;
    return async (context, next) => {
      const key = that.getSessionKey(context);
      if (!key) return next();
      let session = await that.getSession(key);
      Object.defineProperty(context, property, {
        get() {
          return session;
        },
        set(newValue) {
          session = { ...newValue };
        },
      });
      // Saving session object on the next middleware
      await next();
      await that.saveSession(key, session);
    };
  }
}

module.exports = RedisSession;
