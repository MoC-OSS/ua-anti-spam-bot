import { i18n } from '@bot/i18n';

import type { GrammyContext } from '@app-types/context';

export interface DeleteRussianMessageProperties {
  writeUsername: string;
  userId?: number;
  message: string;
}

/**
 * Returns a warning message for Russian language usage with a Ukrainian flag emoji.
 * @param message
 */
export const getWarnRussianMessage = (message: string) => `🫶🇺🇦 ${message}`;

/**
 * Returns a message explaining why a Russian-language message was deleted.
 * @param context
 * @param root0
 * @param root0.writeUsername
 * @param root0.userId
 * @param root0.message
 */
export const getDeleteRussianMessage = (context: GrammyContext, { writeUsername, userId, message }: DeleteRussianMessageProperties) => {
  const atom =
    userId && writeUsername ? context.t('delete-user-atom-with-user', { userId, writeUsername }) : context.t('delete-user-atom-no-user');

  return `${atom}\n\n${getWarnRussianMessage(message)}`;
};

/**
 * Returns extra Ukrainian language message based on detection percentage.
 * @param percent
 */
export const getUkrainianMessageExtra = (percent: number) => (percent === 200 ? `\n${i18n.t('uk', 'russian-extra-letters')}` : '');
