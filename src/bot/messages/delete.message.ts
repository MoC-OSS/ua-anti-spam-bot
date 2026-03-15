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
 */
export const getCannotDeleteMessage = (context: GrammyContext, { adminsString }: CannotDeleteMessageProperties) =>
  context.t('cannot-delete-message', { adminsString: adminsString ?? 'none' });
