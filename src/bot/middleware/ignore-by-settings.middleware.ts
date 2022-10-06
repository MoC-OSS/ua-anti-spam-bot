import type { Middleware } from 'grammy';

import type { ChatSessionData, GrammyContext } from '../../types';

/**
 * @param {keyof ChatSessionData['chatSettings']} key
 *
 * @returns {GrammyMiddleware}
 * */
export const ignoreBySettingsMiddleware =
  (key: keyof ChatSessionData['chatSettings']): Middleware<GrammyContext> =>
  async (context, next) => {
    if (context.chatSession.chatSettings[key] !== true) {
      await next();
    }
  };
