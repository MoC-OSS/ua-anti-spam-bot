class RedisSession {
  constructor(sessionClient) {
    this.session = sessionClient;
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
  }

  getSessionKey(ctx) {
    return this.options.getSessionKey(ctx);
  }

  getSession(key) {
    return this.session.getSession(key);
  }

  saveSession(key, data) {
    return this.session.setSession(key, data);
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
