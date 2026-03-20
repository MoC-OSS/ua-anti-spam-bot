import { i18n } from '@bot/i18n';

import type { GrammyContext } from '@app-types/context';

export interface DeleteRussianMessageProperties {
  writeUsername: string;
  userId?: number;
  message: string;
}

/**
 * Returns a warning message for Russian language usage with a Ukrainian flag emoji.
 * @param message - The localized warning text to prepend the flag emoji to.
 * @returns The formatted Russian-language warning string.
 */
export const getWarnRussianMessage = (message: string) => `🫶🇺🇦 ${message}`;

/**
 * Returns a message explaining why a Russian-language message was deleted.
 * @param context - Grammy bot context.
 * @param root0 - Delete Russian message properties.
 * @param root0.writeUsername - The formatted username of the message author.
 * @param root0.userId - The Telegram user ID of the message author.
 * @param root0.message - The localized deletion reason message.
 * @returns The formatted Russian-delete notification message string.
 */
export const getDeleteRussianMessage = (context: GrammyContext, { writeUsername, userId, message }: DeleteRussianMessageProperties) => {
  const atom =
    userId && writeUsername ? context.t('delete-user-atom-with-user', { userId, writeUsername }) : context.t('delete-user-atom-no-user');

  return `${atom}\n\n${getWarnRussianMessage(message)}`;
};

/**
 * Returns extra Ukrainian language message based on detection percentage.
 * @param percent - The detection percentage (200 triggers an extra letters message).
 * @returns An extra message string if percent equals 200, otherwise an empty string.
 */
export const getUkrainianMessageExtra = (percent: number) => (percent === 200 ? `\n${i18n.t('uk', 'russian-extra-letters')}` : '');
