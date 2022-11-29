import type { GrammyFilter, OptionalChatSettings } from '../../types';

/**
 * @returns {true} when optional settings is enabled
 * */
export const onlyActiveOptionalSettingFilter =
  (key: keyof OptionalChatSettings): GrammyFilter =>
  (context) =>
    context.chatSession.chatSettings[key] === true;
