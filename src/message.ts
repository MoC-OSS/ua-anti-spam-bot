import moment from 'moment-timezone';

import type { GrammyContext } from './types/context';
import type { ChatSessionData, FeaturesSessionsData } from './types/session';
import { formatStateIntoAccusative, getRandomItem } from './utils/generic.util';
import { environmentConfig } from './config';
import { helpChat } from './creator';
import { ALARM_END_DAY_COUNT, ALARM_END_GENERIC_COUNT, ALARM_END_NIGHT_COUNT, ALARM_START_GENERIC_COUNT, i18n } from './i18n';

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

export const randomBanEmojis = ['👮🏻‍♀️', '🤦🏼‍♀️', '🙅🏻‍♀️'];

export const randomLocationBanEmojis = ['🏡', '🏘️', '🌳'];

export const isNight = () => {
  const hours = +moment().format('H');

  return hours >= 20 || hours <= 5;
};

export const getDayTimeEmoji = () => (isNight() ? '🌖' : '☀️');

function getCurrentTime() {
  return moment().format('LT');
}

function randomT(locale: string, prefix: string, count: number): string {
  // eslint-disable-next-line sonarjs/pseudo-random
  const index = Math.floor(Math.random() * count) + 1;

  return i18n.t(locale, `${prefix}-${index}`);
}

const getRandomAlarmStartText = (): string => {
  const currentTimeEmoji = getDayTimeEmoji();
  const randomAlarmEmoji = getRandomItem(['⚠️', '❗️', '🔊', '🚨', '📢', '❕', currentTimeEmoji]);
  const text = randomT('uk', 'alarm-start', ALARM_START_GENERIC_COUNT);

  return `${text} ${randomAlarmEmoji}`;
};

const getRandomAlarmEndText = (): string => {
  const currentTimeEmoji = getDayTimeEmoji();
  const randomAlarmEmoji = `${getRandomItem(['🇺🇦', '��', currentTimeEmoji])} `;

  if (isNight()) {
    const totalCount = ALARM_END_GENERIC_COUNT + ALARM_END_NIGHT_COUNT;
    // eslint-disable-next-line sonarjs/pseudo-random
    const index = Math.floor(Math.random() * totalCount) + 1;

    if (index <= ALARM_END_GENERIC_COUNT) {
      const key = `alarm-end-${index}` as const;

      return `${i18n.t('uk', key)} ${randomAlarmEmoji}`;
    }

    const nightKey = `alarm-end-night-${index - ALARM_END_GENERIC_COUNT}` as const;

    return `${i18n.t('uk', nightKey)} ${currentTimeEmoji}`;
  }

  const totalCount = ALARM_END_GENERIC_COUNT + ALARM_END_DAY_COUNT;
  // eslint-disable-next-line sonarjs/pseudo-random
  const index = Math.floor(Math.random() * totalCount) + 1;

  if (index <= ALARM_END_GENERIC_COUNT) {
    const key = `alarm-end-${index}` as const;

    return `${i18n.t('uk', key)} ${randomAlarmEmoji}`;
  }

  const dayKey = `alarm-end-day-${index - ALARM_END_GENERIC_COUNT}` as const;

  return i18n.t('uk', dayKey);
};

/**
 * @param {ChatSessionData['chatSettings']} settings
 * @param isRepeatedAlarm
 * */
export const getAlarmStartNotificationMessage = (settings: ChatSessionData['chatSettings'], isRepeatedAlarm = false) =>
  i18n.t('uk', 'alarm-start-notification', {
    time: getCurrentTime(),
    repeated: isRepeatedAlarm ? 'yes' : 'no',
    state: formatStateIntoAccusative(settings.airRaidAlertSettings.state || ''),
    text: getRandomAlarmStartText(),
  });

/**
 * @param {ChatSessionData['chatSettings']} settings
 * */
export const alarmEndNotificationMessage = (settings: ChatSessionData['chatSettings']) =>
  i18n.t('uk', 'alarm-end-notification', {
    time: getCurrentTime(),
    state: formatStateIntoAccusative(settings.airRaidAlertSettings.state || ''),
    text: getRandomAlarmEndText(),
  });

export const chatIsMutedMessage = () => i18n.t('uk', 'alarm-chat-muted');

export const chatIsUnmutedMessage = () => i18n.t('uk', 'alarm-chat-unmuted');

/**
 * Complex - Settings
 * */
export const getAirRaidAlarmSettingsMessage = (context: GrammyContext, settings: ChatSessionData['chatSettings']) =>
  [
    context.t('alarm-settings-title'),
    context.t('alarm-settings-description'),
    '',
    settings.airRaidAlertSettings.state
      ? `🏰 ${context.t('alarm-settings-state-set', { state: settings.airRaidAlertSettings.state })}`
      : `🏰 ${context.t('alarm-settings-state-not-set')}`,
    '',
    context.t('alarm-settings-change-hint'),
  ].join('\n');

export interface GenericBotProperties {
  botName: string;
}

export const getAdminReadyMessage = (context: GrammyContext, { botName }: GenericBotProperties) =>
  context.t('bot-admin-ready', { botName, helpChat });

export interface DeleteMessageProperties {
  writeUsername: string;
  userId?: number;
  wordMessage: string;
  debugMessage: string;
  withLocation?: boolean;
}

/**
 * Message that bot sends on delete
 * */
export const getDeleteMessage = (
  context: GrammyContext,
  { writeUsername, userId, wordMessage, debugMessage, withLocation }: DeleteMessageProperties,
) => {
  const atom =
    userId && writeUsername ? context.t('delete-user-atom-with-user', { userId, writeUsername }) : context.t('delete-user-atom-no-user');

  const reason = withLocation ? context.t('delete-strategic-reason-location') : context.t('delete-strategic-reason');

  const body = context.t('delete-strategic-message', { reason, wordMessage });

  return [atom, '', body, debugMessage].filter(Boolean).join('\n').trim();
};

export interface DeleteFeatureMessageProperties {
  writeUsername: string;
  userId?: number;
  featuresString: string;
}

export const getDeleteFeatureMessage = (
  context: GrammyContext,
  { writeUsername, userId, featuresString }: DeleteFeatureMessageProperties,
) => {
  const atom =
    userId && writeUsername ? context.t('delete-user-atom-with-user', { userId, writeUsername }) : context.t('delete-user-atom-no-user');

  return `${atom}\n\n${context.t('delete-feature-message', { featuresString })}`;
};

export interface GetDeleteNsfwMessageField {
  writeUsername: string;
  userId?: number;
}

export const getDeleteNsfwMessage = (context: GrammyContext, { writeUsername, userId }: GetDeleteNsfwMessageField) => {
  const atom =
    userId && writeUsername ? context.t('delete-user-atom-with-user', { userId, writeUsername }) : context.t('delete-user-atom-no-user');

  return `${atom}\n\n${context.t('delete-nsfw-message')}`;
};

export interface GetDeleteCounteroffensiveMessageField {
  writeUsername: string;
  userId?: number;
}

export const getDeleteCounteroffensiveMessage = (
  context: GrammyContext,
  { writeUsername, userId }: GetDeleteCounteroffensiveMessageField,
) => {
  const atom =
    userId && writeUsername ? context.t('delete-user-atom-with-user', { userId, writeUsername }) : context.t('delete-user-atom-no-user');

  return `${atom}\n\n${context.t('delete-counteroffensive-message')}`;
};

export interface DebugMessageProperties {
  message: string | undefined;
  byRules: Record<string, unknown>;
  startTime: Date;
}

/**
 * Returns debug message that bot adds to delete message if environmentConfig is debug
 * */
export const getDebugMessage = ({ message, byRules, startTime }: DebugMessageProperties) =>
  `
***DEBUG***
Message:
${message || 'Message is undefined'}

Ban reason:
${JSON.stringify(byRules)}

Logic type:
${environmentConfig.USE_SERVER ? 'server' : 'local'}

Last deploy:
${startTime.toString()}
`.trim();

export interface ChatStatisticsMessageProperties {
  adminsChatsCount: number;
  botRemovedCount: number;
  channelCount: number;
  groupCount: number;
  memberChatsCount: number;
  privateCount: number;
  superGroupsCount: number;
  totalSessionCount: number;
  totalUserCounts: number;
}

export interface FeaturesStatisticsMessageProperties {
  features: FeaturesSessionsData;
  chatsCount: number;
}

function toPercent(count: number, total: number) {
  return ((count / total) * 100).toFixed(2);
}

/**
 * Message that bot sends on /statistics
 * */
export const getChatStatisticsMessage = (
  context: GrammyContext,
  {
    adminsChatsCount,
    botRemovedCount,
    channelCount,
    groupCount,
    memberChatsCount,
    privateCount,
    superGroupsCount,
    totalSessionCount,
    totalUserCounts,
  }: ChatStatisticsMessageProperties,
) =>
  [
    context.t('statistics-chat-header'),
    context.t('statistics-chats-count', { count: totalSessionCount }),
    context.t('statistics-users-count', { count: totalUserCounts }),
    '',
    context.t('statistics-groups-header'),
    '',
    context.t('statistics-super-groups', { count: superGroupsCount }),
    context.t('statistics-groups', { count: groupCount }),
    '',
    context.t('statistics-admin-active', { count: adminsChatsCount }),
    context.t('statistics-admin-disabled', { count: memberChatsCount }),
    '',
    context.t('statistics-bot-removed', { count: botRemovedCount }),
    '',
    context.t('statistics-other-header'),
    '',
    context.t('statistics-private', { count: privateCount }),
    context.t('statistics-channels', { count: channelCount }),
  ].join('\n');

/**
 * Message that bot sends on /statistics for features
 * */
export const getFeaturesStatisticsMessage = (context: GrammyContext, { features, chatsCount }: FeaturesStatisticsMessageProperties) =>
  [
    context.t('features-statistics-header', { chatsCount }),
    '',
    context.t('features-statistics-disabled-header'),
    context.t('feature-stat-strategic', {
      count: features.disableStrategicInfo,
      percent: toPercent(features.disableStrategicInfo, chatsCount),
    }),
    context.t('feature-stat-delete-message', {
      count: features.disableDeleteMessage,
      percent: toPercent(features.disableDeleteMessage, chatsCount),
    }),
    context.t('feature-stat-swindler', {
      count: features.disableSwindlerMessage,
      percent: toPercent(features.disableSwindlerMessage, chatsCount),
    }),
    context.t('feature-stat-service-messages', {
      count: features.disableDeleteServiceMessage,
      percent: toPercent(features.disableDeleteServiceMessage, chatsCount),
    }),
    context.t('feature-stat-nsfw', { count: features.disableNsfwFilter, percent: toPercent(features.disableNsfwFilter, chatsCount) }),
    context.t('feature-stat-antisemitism', {
      count: features.disableDeleteAntisemitism,
      percent: toPercent(features.disableDeleteAntisemitism, chatsCount),
    }),
    '',
    context.t('features-statistics-enabled-header'),
    context.t('feature-stat-alarm-mute', {
      count: features.disableChatWhileAirRaidAlert,
      percent: toPercent(features.disableChatWhileAirRaidAlert, chatsCount),
    }),
    context.t('feature-stat-cards', { count: features.enableDeleteCards, percent: toPercent(features.enableDeleteCards, chatsCount) }),
    context.t('feature-stat-urls', { count: features.enableDeleteUrls, percent: toPercent(features.enableDeleteUrls, chatsCount) }),
    context.t('feature-stat-locations', {
      count: features.enableDeleteLocations,
      percent: toPercent(features.enableDeleteLocations, chatsCount),
    }),
    context.t('feature-stat-mentions', {
      count: features.enableDeleteMentions,
      percent: toPercent(features.enableDeleteMentions, chatsCount),
    }),
    context.t('feature-stat-forwards', {
      count: features.enableDeleteForwards,
      percent: toPercent(features.enableDeleteForwards, chatsCount),
    }),
    context.t('feature-stat-channel-messages', {
      count: features.enableDeleteChannelMessages,
      percent: toPercent(features.enableDeleteForwards, chatsCount),
    }),
    context.t('feature-stat-counteroffensive', {
      count: features.enableDeleteCounteroffensive,
      percent: toPercent(features.enableDeleteCounteroffensive, chatsCount),
    }),
    context.t('feature-stat-delete-russian', {
      count: features.enableDeleteRussian,
      percent: toPercent(features.enableDeleteRussian, chatsCount),
    }),
    context.t('feature-stat-warn-russian', {
      count: features.enableWarnRussian,
      percent: toPercent(features.enableWarnRussian, chatsCount),
    }),
    context.t('feature-stat-alarm-notify', {
      count: features.notificationMessage,
      percent: toPercent(features.notificationMessage, chatsCount),
    }),
    context.t('feature-stat-delete-obscene', {
      count: features.enableDeleteObscene,
      percent: toPercent(features.enableDeleteObscene, chatsCount),
    }),
    context.t('feature-stat-warn-obscene', {
      count: features.enableWarnObscene,
      percent: toPercent(features.enableWarnObscene, chatsCount),
    }),
  ].join('\n');

export interface HelpMessageProperties {
  startLocaleTime: string;
  isAdmin?: boolean;
  canDelete: boolean;
  user: string;
  userId: number;
}

/**
 * Help handler
 * */
export const getHelpMessage = (context: GrammyContext, { startLocaleTime, isAdmin, canDelete, user, userId }: HelpMessageProperties) =>
  [
    `<a href="tg://user?id=${userId}">${user}</a>`,
    '',
    isAdmin ? context.t('bot-admin-active') : context.t('bot-make-admin'),
    canDelete ? context.t('bot-has-delete-permission') : context.t('bot-no-delete-permission'),
    '',
    context.t('help-if-wrong-delete'),
    '',
    context.t('help-if-wrong-delete-option-1'),
    context.t('help-if-wrong-delete-option-2'),
    '',
    context.t('help-last-update'),
    '',
    `${startLocaleTime},`,
    '',
    context.t('help-support-chat', { helpChat }),
    '',
    context.t('help-hotline-header'),
    '',
    context.t('help-hotline-text'),
    '',
    'Детальніше за командою /hotline_security',
  ].join('\n');

/**
 * Message that bot will send when user uses /start in private
 * */
export const getStartMessage = (context: GrammyContext) =>
  [context.t('start-message-atom'), '', context.t('start-private-instructions', { helpChat })].join('\n');

export interface GroupStartMessageProperties {
  adminsString?: string;
  isAdmin?: boolean;
  canDelete: boolean;
  user?: string;
  userId?: number;
}

/**
 * Message that bot sends when user uses /start in the group
 * */
export const getGroupStartMessage = (
  context: GrammyContext,
  { adminsString, isAdmin = false, canDelete, user = '', userId }: GroupStartMessageProperties,
) => {
  const lines: string[] = [
    userId ? `<a href="tg://user?id=${userId}">${user}</a>` : user,
    '',
    isAdmin ? context.t('bot-admin-active') : context.t('bot-make-admin'),
    canDelete ? context.t('bot-has-delete-permission') : context.t('bot-no-delete-permission'),
  ];

  if (!isAdmin || !canDelete) {
    lines.push('', adminsString ? context.t('start-group-admins-help', { adminsString }) : context.t('start-group-creator-help'));
  }

  return lines.join('\n').trim();
};

export interface CannotDeleteMessageProperties {
  adminsString?: string;
}

export const getCannotDeleteMessage = (context: GrammyContext, { adminsString }: CannotDeleteMessageProperties) =>
  context.t('cannot-delete-message', { adminsString: adminsString ?? 'none' });

/**
 * Message that bot sends when user invites it into a channel
 * */
export const getStartChannelMessage = (context: GrammyContext, { botName }: GenericBotProperties) =>
  context.t('start-channel-message', { botName, helpChat });

/**
 * Message when bot asks user what does he want to send to all private chats
 * */
export const getUpdatesMessage = (context: GrammyContext) => context.t('updates-prompt');

export interface UpdateMessageProperties {
  totalCount: number;
  finishedCount: number;
  successCount: number;
  type: string;
}

export const getUpdateMessage = (context: GrammyContext, { totalCount, finishedCount, successCount, type }: UpdateMessageProperties) =>
  [
    context.t('updates-progress', { total: totalCount, finished: finishedCount, type }),
    context.t('updates-progress-success', { success: successCount }),
  ].join('\n');

export interface SuccessfulMessageProperties {
  totalCount: number;
  successCount: number;
}

export const getSuccessfulMessage = (context: GrammyContext, { totalCount, successCount }: SuccessfulMessageProperties) =>
  [context.t('updates-done'), context.t('updates-done-count', { total: totalCount, success: successCount })].join('\n');

export interface BotJoinMessageProperties {
  adminsString?: string;
  isAdmin?: boolean;
  canDelete: boolean;
}

/**
 * Message that bot sends when user invites it into a group
 * */
export const getBotJoinMessage = (context: GrammyContext, { adminsString, isAdmin = false, canDelete }: BotJoinMessageProperties) =>
  [
    context.t('start-message-atom'),
    '',
    getGroupStartMessage(context, { adminsString, isAdmin, canDelete, user: undefined, userId: undefined }).trim(),
  ].join('\n');

export interface TensorTestResultProperties {
  chance: string;
  isSpam: boolean;
}

/**
 * Test messages
 */
export const getTensorTestResult = (context: GrammyContext, { chance, isSpam }: TensorTestResultProperties) =>
  [
    context.t('tensor-test-spam-chance', { chance }),
    isSpam ? context.t('tensor-test-verdict-spam') : context.t('tensor-test-verdict-not-spam'),
  ].join('\n');

/**
 * Russian warn/delete messages
 * */

export interface DeleteRussianMessageProperties {
  writeUsername: string;
  userId?: number;
  message: string;
}

export const getWarnRussianMessage = (message: string) => `🫶🇺🇦 ${message}`;

export const getDeleteRussianMessage = (context: GrammyContext, { writeUsername, userId, message }: DeleteRussianMessageProperties) => {
  const atom =
    userId && writeUsername ? context.t('delete-user-atom-with-user', { userId, writeUsername }) : context.t('delete-user-atom-no-user');

  return `${atom}\n\n${getWarnRussianMessage(message)}`;
};

export const getUkrainianMessageExtra = (percent: number) => (percent === 200 ? `\n${i18n.t('uk', 'russian-extra-letters')}` : '');

/**
 * Logs
 * */
export const swindlerLogsStartMessage = "Looks like swindler's message";

export const russianDeleteLogsStartMessage = 'Deleted russian message';

export const russianWarnLogsStartMessage = 'Warn russian message';

export const nsfwLogsStartMessage = 'Looks like nsfw';

export const cannotDeleteMessage = 'Cannot delete the following message from chat';

export const urlLogsStartMessage = 'Deleted URLs message';

export const locationLogsStartMessage = 'Deleted location message';

export const mentionLogsStartMessage = 'Deleted mention message';

export const cardLogsStartMessage = 'Deleted card message';

export const counteroffensiveLogsStartMessage = 'Deleted counteroffensive message by';

export const obsceneDeleteLogsStartMessage = 'Delete obscene message';

export const obsceneWarnLogsStartMessage = 'Warn obscene message';

export const antisemitismDeleteLogsStartMessage = 'Delete antisemitism message';

export const channelMessageLogsStartMessage = 'Deleted message from channel';

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
