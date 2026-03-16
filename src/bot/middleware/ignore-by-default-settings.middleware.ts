import type { GrammyMiddleware } from '@app-types/context';
import type { DefaultChatSettings } from '@app-types/session';

/**
 * Short-circuits the middleware chain when a specific chat setting is enabled.
 * Use to conditionally disable features based on per-chat default settings.
 * @param key - The key of the chat setting to check
 * @returns A Grammy middleware function that short-circuits if the given setting is enabled
 */
export const ignoreByDefaultSettingsMiddleware =
  (key: keyof DefaultChatSettings): GrammyMiddleware =>
  async (context, next) => {
    // eslint-disable-next-line security/detect-object-injection
    if (context.chatSession.chatSettings[key] !== true) {
      await next();
    }
  };
