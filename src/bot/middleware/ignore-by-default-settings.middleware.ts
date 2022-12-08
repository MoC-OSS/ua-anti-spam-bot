import type { DefaultChatSettings, GrammyMiddleware } from '../../types';

export const ignoreByDefaultSettingsMiddleware =
  (key: keyof DefaultChatSettings): GrammyMiddleware =>
  async (context, next) => {
    if (context.chatSession.chatSettings[key] !== true) {
      await next();
    }
  };
