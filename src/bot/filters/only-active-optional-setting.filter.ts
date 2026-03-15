import type { GrammyFilter } from '@app-types/context';
import type { OptionalChatSettings } from '@app-types/session';

/**
 * Filter that checks whether an optional chat setting is enabled.
 * @returns {true} when optional settings is enabled
 * */
export const onlyActiveOptionalSettingFilter =
  (key: keyof OptionalChatSettings): GrammyFilter =>
  (context) =>
    // eslint-disable-next-line security/detect-object-injection
    context.chatSession.chatSettings[key] === true;
