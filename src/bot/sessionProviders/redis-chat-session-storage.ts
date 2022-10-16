import { redisClient } from '../../db';

export class RedisChatSession {
  options: any;

  constructor() {
    this.options = {
      property: 'chatSession',
      state: {},
      format: {},
      getSessionKey: (context) => {
        if (!context.from) return; // should never happen
        let chatInstance;
        if (context.chat) {
          chatInstance = context.chat.id;
        } else if (context.updateType === 'callback_query') {
          chatInstance = context.callbackQuery.chat_instance;
        } else {
          chatInstance = context.from.id;
        }
        return chatInstance;
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

module.exports = RedisChatSession;
