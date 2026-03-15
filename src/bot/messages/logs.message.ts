/** Log prefix for swindler message detection. */
export const swindlerLogsStartMessage = "Looks like swindler's message";

/** Log prefix for Russian message deletion. */
export const russianDeleteLogsStartMessage = 'Deleted russian message';

/** Log prefix for Russian message warning. */
export const russianWarnLogsStartMessage = 'Warn russian message';

/** Log prefix for NSFW content detection. */
export const nsfwLogsStartMessage = 'Looks like nsfw';

/** Log prefix for failed message deletion attempts. */
export const cannotDeleteMessage = 'Cannot delete the following message from chat';

/** Log prefix for URL message deletion. */
export const urlLogsStartMessage = 'Deleted URLs message';

/** Log prefix for location message deletion. */
export const locationLogsStartMessage = 'Deleted location message';

/** Log prefix for mention message deletion. */
export const mentionLogsStartMessage = 'Deleted mention message';

/** Log prefix for card message deletion. */
export const cardLogsStartMessage = 'Deleted card message';

/** Log prefix for counteroffensive message deletion. */
export const counteroffensiveLogsStartMessage = 'Deleted counteroffensive message by';

/** Log prefix for obscene message deletion. */
export const obsceneDeleteLogsStartMessage = 'Delete obscene message';

/** Log prefix for obscene message warning. */
export const obsceneWarnLogsStartMessage = 'Warn obscene message';

/** Log prefix for antisemitism message deletion. */
export const antisemitismDeleteLogsStartMessage = 'Delete antisemitism message';

/** Log prefix for channel message deletion. */
export const channelMessageLogsStartMessage = 'Deleted message from channel';

/** Set of all log start messages used for identifying bot-generated log entries. */
export const logsStartMessages = new Set([
  swindlerLogsStartMessage,
  russianDeleteLogsStartMessage,
  russianWarnLogsStartMessage,
  nsfwLogsStartMessage,
  cannotDeleteMessage,
  urlLogsStartMessage,
  locationLogsStartMessage,
  mentionLogsStartMessage,
  cardLogsStartMessage,
  counteroffensiveLogsStartMessage,
  obsceneDeleteLogsStartMessage,
  obsceneWarnLogsStartMessage,
  antisemitismDeleteLogsStartMessage,
  channelMessageLogsStartMessage,
]);
