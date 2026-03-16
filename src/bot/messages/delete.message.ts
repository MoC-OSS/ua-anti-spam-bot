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
 * @param context
 * @param root0
 * @param root0.botName
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
 * @param context
 * @param root0
 * @param root0.writeUsername
 * @param root0.userId
 * @param root0.wordMessage
 * @param root0.debugMessage
 * @param root0.withLocation
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
 * @param context
 * @param root0
 * @param root0.writeUsername
 * @param root0.userId
 * @param root0.featuresString
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
 * @param context
 * @param root0
 * @param root0.writeUsername
 * @param root0.userId
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
 * @param context
 * @param root0
 * @param root0.writeUsername
 * @param root0.userId
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
 * @param context
 * @param root0
 * @param root0.adminsString
 */
export const getCannotDeleteMessage = (context: GrammyContext, { adminsString }: CannotDeleteMessageProperties) =>
  context.t('cannot-delete-message', { adminsString: adminsString ?? 'none' });
