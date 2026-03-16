import moment from 'moment-timezone';

import { ALARM_END_DAY_COUNT, ALARM_END_GENERIC_COUNT, ALARM_END_NIGHT_COUNT, ALARM_START_GENERIC_COUNT, i18n } from '@bot/i18n';

import type { GrammyContext } from '@app-types/context';
import type { ChatSessionData } from '@app-types/session';

import { formatStateIntoAccusative, getRandomItem } from '@utils/generic.util';

/**
 * Checks whether current time is night-time (between 20:00 and 05:00).
 */
export const isNight = () => {
  const hours = +moment().format('H');

  return hours >= 20 || hours <= 5;
};

/**
 * Returns an emoji representing the current time of day (moon at night, sun during the day).
 */
export const getDayTimeEmoji = () => (isNight() ? '🌖' : '☀️');

/**
 *
 */
function getCurrentTime() {
  return moment().format('LT');
}

/**
 *
 * @param locale
 * @param prefix
 * @param count
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
 * Returns the air-raid alarm start notification message for a given chat.
 * @param settings - Chat settings containing alert state.
 * @param isRepeatedAlarm - Whether this is a repeated alarm notification.
 */
export const getAlarmStartNotificationMessage = (settings: ChatSessionData['chatSettings'], isRepeatedAlarm = false) =>
  i18n.t('uk', 'alarm-start-notification', {
    time: getCurrentTime(),
    repeated: isRepeatedAlarm ? 'yes' : 'no',
    state: formatStateIntoAccusative(settings.airRaidAlertSettings.state || ''),
    text: getRandomAlarmStartText(),
  });

/**
 * Returns the air-raid alarm end notification message for a given chat.
 * @param settings - Chat settings containing alert state.
 */
export const alarmEndNotificationMessage = (settings: ChatSessionData['chatSettings']) =>
  i18n.t('uk', 'alarm-end-notification', {
    time: getCurrentTime(),
    state: formatStateIntoAccusative(settings.airRaidAlertSettings.state || ''),
    text: getRandomAlarmEndText(),
  });

/**
 * Returns a message indicating that the chat is muted during an air-raid alarm.
 */
export const chatIsMutedMessage = () => i18n.t('uk', 'alarm-chat-muted');

/**
 * Returns a message indicating that the chat has been unmuted after an air-raid alarm.
 */
export const chatIsUnmutedMessage = () => i18n.t('uk', 'alarm-chat-unmuted');

/**
 * Returns the air-raid alarm settings message for a given chat.
 * @param context - Grammy bot context.
 * @param settings - Chat settings containing alert configuration.
 */
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
