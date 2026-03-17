/**
 * @module message
 * @description Barrel file that re-exports all message template functions.
 * Each domain-specific message module lives in its own file under `src/message/`.
 */

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getCheckAdminNotification } from './admin.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getDeleteAntisemitismMessage } from './antisemitism.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getDeleteObsceneMessage, getWarnObsceneMessage } from './obscene.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { DeleteObsceneMessageProperties } from './obscene.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getHasNoLinkedChats, getIsNotAdminMessage, getLinkToWebView } from './settings.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { DeleteMessageAtomProperties } from './shared.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export {
  getSwindlersHelpMessage,
  getSwindlersUpdateEndMessage,
  getSwindlersUpdateStartMessage,
  getSwindlersWarningMessage,
} from './swindlers.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getDeleteDenylistMessage } from './denylist.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export {
  isNight,
  getDayTimeEmoji,
  getAlarmStartNotificationMessage,
  alarmEndNotificationMessage,
  chatIsMutedMessage,
  chatIsUnmutedMessage,
  getAirRaidAlarmSettingsMessage,
} from './alarm.message';

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
} from './delete.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type {
  GenericBotProperties,
  DeleteMessageProperties,
  DeleteFeatureMessageProperties,
  GetDeleteNsfwMessageField,
  GetDeleteCounteroffensiveMessageField,
  CannotDeleteMessageProperties,
} from './delete.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getChatStatisticsMessage, getFeaturesStatisticsMessage } from './statistics.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { ChatStatisticsMessageProperties, FeaturesStatisticsMessageProperties } from './statistics.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getHelpMessage, getStartMessage, getGroupStartMessage, getStartChannelMessage, getBotJoinMessage } from './help.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { HelpMessageProperties, GroupStartMessageProperties, BotJoinMessageProperties } from './help.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getDebugMessage } from './debug.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { DebugMessageProperties } from './debug.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getTensorTestResult } from './tensor.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { TensorTestResultProperties } from './tensor.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getUpdatesMessage, getUpdateMessage, getSuccessfulMessage } from './updates.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { UpdateMessageProperties, SuccessfulMessageProperties } from './updates.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export { getDeleteRussianMessage, getWarnRussianMessage, getUkrainianMessageExtra } from './russian.message';

// eslint-disable-next-line no-barrel-files/no-barrel-files
export type { DeleteRussianMessageProperties } from './russian.message';

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
} from './logs.message';
