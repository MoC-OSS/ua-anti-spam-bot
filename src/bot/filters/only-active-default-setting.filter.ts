import type { DefaultChatSettings, GrammyFilter } from '../../types';

/**
 * @returns {true} when default settings is enabled
 * */
export const onlyActiveDefaultSettingFilter =
  (key: keyof DefaultChatSettings): GrammyFilter =>
  (context) =>
    context.chatSession.chatSettings[key] !== true;
