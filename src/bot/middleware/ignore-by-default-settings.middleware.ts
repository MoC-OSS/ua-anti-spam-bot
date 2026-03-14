import type { GrammyMiddleware } from '@app-types/context';
import type { DefaultChatSettings } from '@app-types/session';

export const ignoreByDefaultSettingsMiddleware =
  (key: keyof DefaultChatSettings): GrammyMiddleware =>
  async (context, next) => {
    // eslint-disable-next-line security/detect-object-injection
    if (context.chatSession.chatSettings[key] !== true) {
      await next();
    }
  };
