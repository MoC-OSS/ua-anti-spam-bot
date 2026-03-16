import type { GrammyContext } from '@app-types/context';
import type { FeaturesSessionsData } from '@app-types/session';

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

/**
 *
 * @param count
 * @param total
 */
function toPercent(count: number, total: number) {
  return ((count / total) * 100).toFixed(2);
}

/**
 * Returns the chat statistics message displayed via the /statistics command.
 * @param context
 * @param root0
 * @param root0.adminsChatsCount
 * @param root0.botRemovedCount
 * @param root0.channelCount
 * @param root0.groupCount
 * @param root0.memberChatsCount
 * @param root0.privateCount
 * @param root0.superGroupsCount
 * @param root0.totalSessionCount
 * @param root0.totalUserCounts
 */
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
 * Returns the features statistics message displaying usage percentages for each feature.
 * @param context
 * @param root0
 * @param root0.features
 * @param root0.chatsCount
 */
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
