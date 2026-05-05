import moment from 'moment-timezone';

import { ALARM_END_DAY_COUNT, ALARM_END_GENERIC_COUNT, ALARM_END_NIGHT_COUNT, ALARM_START_GENERIC_COUNT, i18n } from '@bot/i18n';

import type { GrammyContext } from '@app-types/context';
import type { ChatSessionData } from '@app-types/session';

import { formatRegionNameToLocative, getRandomItem } from '@utils/generic.util';

/**
 * Checks whether current time is night-time (between 20:00 and 05:00).
 * @returns `true` if it is currently night-time, `false` otherwise.
 */
export const isNight = () => {
  const hours = +moment().format('H');

  return hours >= 20 || hours <= 5;
};

/**
 * Returns an emoji representing the current time of day (moon at night, sun during the day).
 * @returns A moon emoji at night or a sun emoji during the day.
 */
export const getDayTimeEmoji = () => (isNight() ? '🌖' : '☀️');

/**
 * Returns the current local time formatted as a short time string (HH:mm).
 * @returns The formatted current time string.
 */
function getCurrentTime() {
  return moment().format('LT');
}

/**
 * Returns a random translated string from a numbered key set using the given i18n locale.
 * @param locale - The locale code to use for translation (e.g. 'uk').
 * @param prefix - The key prefix shared by all numbered variants (e.g. 'alarm-start').
 * @param count - Total number of variants available for the given prefix.
 * @returns A randomly selected translated string.
 */
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
  const randomAlarmEmoji = `${getRandomItem(['🇺🇦', '✅', currentTimeEmoji])} `;

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
 * Returns the air-raid alarm start notification message.
 * @param regionName - The Ukrainian region name for display in the notification.
 * @param isRepeatedAlarm - Whether this is a repeated alarm notification.
 * @returns The formatted alarm start notification string.
 */
export const getAlarmStartNotificationMessage = (regionName: string, isRepeatedAlarm = false) =>
  i18n.t('uk', 'alarm-start-notification', {
    time: getCurrentTime(),
    repeated: isRepeatedAlarm ? 'yes' : 'no',
    state: formatRegionNameToLocative(regionName),
    text: getRandomAlarmStartText(),
  });

/**
 * Returns the air-raid alarm end notification message.
 * @param regionName - The Ukrainian region name for display in the notification.
 * @returns The formatted alarm end notification string.
 */
export const alarmEndNotificationMessage = (regionName: string) =>
  i18n.t('uk', 'alarm-end-notification', {
    time: getCurrentTime(),
    state: formatRegionNameToLocative(regionName),
    text: getRandomAlarmEndText(),
  });

/**
 * Returns a message indicating that the chat is muted during an air-raid alarm.
 * @returns The localized chat-muted message string.
 */
export const chatIsMutedMessage = () => i18n.t('uk', 'alarm-chat-muted');

/**
 * Returns a message indicating that the chat has been unmuted after an air-raid alarm.
 * @returns The localized chat-unmuted message string.
 */
export const chatIsUnmutedMessage = () => i18n.t('uk', 'alarm-chat-unmuted');

/**
 * Returns the air-raid alarm settings message for a given chat.
 * @param context - Grammy bot context.
 * @param settings - Chat settings containing alert configuration.
 * @param regionName - Resolved Ukrainian region name for display, or null if no region is selected.
 * @returns The formatted alarm settings message string.
 */
export const getAirRaidAlarmSettingsMessage = (
  context: GrammyContext,
  settings: ChatSessionData['chatSettings'],
  regionName: string | null,
) => {
  const regionLine = regionName
    ? `🏰 ${context.t('alarm-settings-state-set', { state: regionName })}`
    : `🏰 ${context.t('alarm-settings-state-not-set')}`;

  return [
    context.t('alarm-settings-title'),
    context.t('alarm-settings-description'),
    '',
    regionLine,
    '',
    context.t('alarm-settings-change-hint'),
  ].join('\n');
};
