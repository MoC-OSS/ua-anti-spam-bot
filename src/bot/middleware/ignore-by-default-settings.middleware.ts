import type { GrammyMiddleware } from '@app-types/context';
import type { DefaultChatSettings } from '@app-types/session';

/**
 * Short-circuits the middleware chain when a specific chat setting is enabled.
 * Use to conditionally disable features based on per-chat default settings.
 */
export const ignoreByDefaultSettingsMiddleware =
  (key: keyof DefaultChatSettings): GrammyMiddleware =>
  async (context, next) => {
    // eslint-disable-next-line security/detect-object-injection
    if (context.chatSession.chatSettings[key] !== true) {
      await next();
    }
  };
