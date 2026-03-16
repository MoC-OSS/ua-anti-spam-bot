import type { GrammyFilter } from '@app-types/context';
import type { DefaultChatSettings } from '@app-types/session';

/**
 * Filter that checks whether a default chat setting has not been disabled.
 * @param key
 * @returns when default settings is enabled
 */
export const onlyActiveDefaultSettingFilter =
  (key: keyof DefaultChatSettings): GrammyFilter =>
  (context) =>
    // eslint-disable-next-line security/detect-object-injection
    context.chatSession.chatSettings[key] !== true;
