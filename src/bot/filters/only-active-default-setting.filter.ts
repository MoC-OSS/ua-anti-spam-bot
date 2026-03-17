import type { GrammyFilter } from '@app-types/context';
import type { DefaultChatSettings } from '@app-types/session';

/**
 * Filter that checks whether a default chat setting has not been disabled.
 * @param key - The key of the default chat setting to check
 * @returns True if the default setting has not been disabled, false otherwise
 */
export const onlyActiveDefaultSettingFilter =
  (key: keyof DefaultChatSettings): GrammyFilter =>
  (context) =>
    // eslint-disable-next-line security/detect-object-injection
    context.chatSession.chatSettings[key] !== true;
