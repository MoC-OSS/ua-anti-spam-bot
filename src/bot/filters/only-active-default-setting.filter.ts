import type { GrammyFilter } from '@app-types/context';
import type { DefaultChatSettings } from '@app-types/session';

/**
 * @returns {true} when default settings is enabled
 * */
export const onlyActiveDefaultSettingFilter =
  (key: keyof DefaultChatSettings): GrammyFilter =>
  (context) =>
    // eslint-disable-next-line security/detect-object-injection
    context.chatSession.chatSettings[key] !== true;
