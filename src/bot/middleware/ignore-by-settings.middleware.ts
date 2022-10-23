import type { ChatSessionData, GrammyMiddleware } from '../../types';

export const ignoreBySettingsMiddleware =
  (key: keyof ChatSessionData['chatSettings']): GrammyMiddleware =>
  async (context, next) => {
    if (context.chatSession.chatSettings[key] !== true) {
      await next();
    }
  };
