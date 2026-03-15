import type { GrammyContext } from '@app-types/context';

import { i18n } from '../i18n';

export interface DeleteRussianMessageProperties {
  writeUsername: string;
  userId?: number;
  message: string;
}

/**
 * Returns a warning message for Russian language usage with a Ukrainian flag emoji.
 */
export const getWarnRussianMessage = (message: string) => `🫶🇺🇦 ${message}`;

/**
 * Returns a message explaining why a Russian-language message was deleted.
 */
export const getDeleteRussianMessage = (context: GrammyContext, { writeUsername, userId, message }: DeleteRussianMessageProperties) => {
  const atom =
    userId && writeUsername ? context.t('delete-user-atom-with-user', { userId, writeUsername }) : context.t('delete-user-atom-no-user');

  return `${atom}\n\n${getWarnRussianMessage(message)}`;
};

/**
 * Returns extra Ukrainian language message based on detection percentage.
 */
export const getUkrainianMessageExtra = (percent: number) => (percent === 200 ? `\n${i18n.t('uk', 'russian-extra-letters')}` : '');
