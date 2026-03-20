import { helpChat } from '@bot/creator';

import type { GrammyContext } from '@app-types/context';

/** Random emojis used in ban messages. */
export const randomBanEmojis = ['👮🏻‍♀️', '🤦🏼‍♀️', '🙅🏻‍♀️'];

/** Random emojis used in location-based ban messages. */
export const randomLocationBanEmojis = ['🏡', '🏘️', '🌳'];

export interface GenericBotProperties {
  botName: string;
}

/**
 * Returns a message confirming the bot has admin privileges and is ready.
 * @param context - Grammy bot context.
 * @param root0 - Generic bot properties.
 * @param root0.botName - The bot's username.
 * @returns The formatted admin-ready message string.
 */
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
 * Returns the message that the bot sends when deleting a strategic/spam message.
 * @param context - Grammy bot context.
 * @param root0 - Delete message properties.
 * @param root0.writeUsername - The formatted username of the message author.
 * @param root0.userId - The numeric Telegram user ID of the message author.
 * @param root0.wordMessage - The word or phrase that triggered deletion.
 * @param root0.debugMessage - Optional debug information appended to the message.
 * @param root0.withLocation - Whether the deletion was triggered by a location-based rule.
 * @returns The formatted delete notification message string.
 */
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

/**
 * Returns a message explaining why a message was deleted due to a feature rule.
 * @param context - Grammy bot context.
 * @param root0 - Delete feature message properties.
 * @param root0.writeUsername - The formatted username of the message author.
 * @param root0.userId - The numeric Telegram user ID of the message author.
 * @param root0.featuresString - A string listing the features that triggered deletion.
 * @returns The formatted feature-delete notification message string.
 */
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

/**
 * Returns a message explaining why a message was deleted due to NSFW content.
 * @param context - Grammy bot context.
 * @param root0 - NSFW delete message properties.
 * @param root0.writeUsername - The formatted username of the message author.
 * @param root0.userId - The numeric Telegram user ID of the message author.
 * @returns The formatted NSFW-delete notification message string.
 */
export const getDeleteNsfwMessage = (context: GrammyContext, { writeUsername, userId }: GetDeleteNsfwMessageField) => {
  const atom =
    userId && writeUsername ? context.t('delete-user-atom-with-user', { userId, writeUsername }) : context.t('delete-user-atom-no-user');

  return `${atom}\n\n${context.t('delete-nsfw-message')}`;
};

export interface GetDeleteCounteroffensiveMessageField {
  writeUsername: string;
  userId?: number;
}

/**
 * Returns a message explaining why a message was deleted due to counteroffensive content.
 * @param context - Grammy bot context.
 * @param root0 - Counteroffensive delete message properties.
 * @param root0.writeUsername - The formatted username of the message author.
 * @param root0.userId - The numeric Telegram user ID of the message author.
 * @returns The formatted counteroffensive-delete notification message string.
 */
export const getDeleteCounteroffensiveMessage = (
  context: GrammyContext,
  { writeUsername, userId }: GetDeleteCounteroffensiveMessageField,
) => {
  const atom =
    userId && writeUsername ? context.t('delete-user-atom-with-user', { userId, writeUsername }) : context.t('delete-user-atom-no-user');

  return `${atom}\n\n${context.t('delete-counteroffensive-message')}`;
};

export interface CannotDeleteMessageProperties {
  adminsString?: string;
}

/**
 * Returns a message indicating the bot cannot delete a message, with optional admin contact info.
 * @param context - Grammy bot context.
 * @param root0 - Cannot-delete message properties.
 * @param root0.adminsString - Optional string listing admin mentions for contacting support.
 * @returns The formatted cannot-delete notification message string.
 */
export const getCannotDeleteMessage = (context: GrammyContext, { adminsString }: CannotDeleteMessageProperties) =>
  context.t('cannot-delete-message', { adminsString: adminsString ?? 'none' });
