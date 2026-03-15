/**
 * @module message
 * @description Barrel file that re-exports all message template functions.
 * Each domain-specific message module lives in its own file under `src/message/`.
 */

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getCheckAdminNotification } from './message/admin.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getDeleteAntisemitismMessage } from './message/antisemitism.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getDeleteObsceneMessage, getWarnObsceneMessage } from './message/obscene.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { DeleteObsceneMessageProperties } from './message/obscene.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getHasNoLinkedChats, getIsNotAdminMessage, getLinkToWebView } from './message/settings.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { DeleteMessageAtomProperties } from './message/shared.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export {
  getSwindlersHelpMessage,
  getSwindlersUpdateEndMessage,
  getSwindlersUpdateStartMessage,
  getSwindlersWarningMessage,
} from './message/swindlers.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getDeleteDenylistMessage } from './message/denylist.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export {
  isNight,
  getDayTimeEmoji,
  getAlarmStartNotificationMessage,
  alarmEndNotificationMessage,
  chatIsMutedMessage,
  chatIsUnmutedMessage,
  getAirRaidAlarmSettingsMessage,
} from './message/alarm.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export {
  randomBanEmojis,
  randomLocationBanEmojis,
  getAdminReadyMessage,
  getDeleteMessage,
  getDeleteFeatureMessage,
  getDeleteNsfwMessage,
  getDeleteCounteroffensiveMessage,
  getCannotDeleteMessage,
} from './message/delete.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type {
  GenericBotProperties,
  DeleteMessageProperties,
  DeleteFeatureMessageProperties,
  GetDeleteNsfwMessageField,
  GetDeleteCounteroffensiveMessageField,
  CannotDeleteMessageProperties,
} from './message/delete.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getChatStatisticsMessage, getFeaturesStatisticsMessage } from './message/statistics.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { ChatStatisticsMessageProperties, FeaturesStatisticsMessageProperties } from './message/statistics.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getHelpMessage, getStartMessage, getGroupStartMessage, getStartChannelMessage, getBotJoinMessage } from './message/help.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { HelpMessageProperties, GroupStartMessageProperties, BotJoinMessageProperties } from './message/help.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getDebugMessage } from './message/debug.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { DebugMessageProperties } from './message/debug.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getTensorTestResult } from './message/tensor.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { TensorTestResultProperties } from './message/tensor.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getUpdatesMessage, getUpdateMessage, getSuccessfulMessage } from './message/updates.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { UpdateMessageProperties, SuccessfulMessageProperties } from './message/updates.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getDeleteRussianMessage, getWarnRussianMessage, getUkrainianMessageExtra } from './message/russian.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { DeleteRussianMessageProperties } from './message/russian.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export {
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
  logsStartMessages,
} from './message/logs.message';
