const redis = require('redis');

class RedisSession {
  constructor(redisUrl) {
    this.client = redis.createClient({ url: redisUrl });
    this.options = {
      property: 'session',
      state: {},
      format: {},
      getSessionKey: (ctx) => {
        if (!ctx.from) return; // should never happen
        let chatInstance;
        if (ctx.chat) {
          chatInstance = ctx.chat.id;
        } else if (ctx.updateType === 'callback_query') {
          chatInstance = ctx.callbackQuery.chat_instance;
        } else {
          chatInstance = ctx.from.id;
        }
        return `${chatInstance}:${ctx.from.id}`;
      },
    };
    this.client.connect();
  }

  getSessionKey(ctx) {
    return this.options.getSessionKey(ctx);
  }

  async getSession(key) {
    if (!key) return {};
    try {
      const sourceSession = await this.client.get(key);
      return JSON.parse(sourceSession) || {};
    } catch (error) {
      console.error(error);
      return {};
    }
  }

  async saveSession(key, data) {
    if (!key || !data) return;

    return this.client.set(key, JSON.stringify(data));
  }

  middleware(property = this.options.property) {
    const that = this;
    return async (ctx, next) => {
      const key = that.getSessionKey(ctx);
      if (!key) return next();
      let session = await that.getSession(key);
      Object.defineProperty(ctx, property, {
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
