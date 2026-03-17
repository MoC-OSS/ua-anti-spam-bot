import { helpChat } from '@bot/creator';

import type { GrammyContext } from '@app-types/context';

import { version } from '../../../package.json';

import type { GenericBotProperties } from './delete.message';

export interface HelpMessageProperties {
  startLocaleTime: string;
  isAdmin?: boolean;
  canDelete: boolean;
  user: string;
  userId: number;
}

/**
 * Returns the help message displayed via the /help command with bot status and support info.
 * @param context - Grammy bot context.
 * @param root0 - Help message properties.
 * @param root0.startLocaleTime - Localized string representing the bot start/deploy time.
 * @param root0.isAdmin - Whether the bot currently has admin rights in the chat.
 * @param root0.canDelete - Whether the bot has permission to delete messages.
 * @param root0.user - The display name of the user requesting help.
 * @param root0.userId - The Telegram user ID of the user requesting help.
 * @returns The formatted help message string.
 */
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
    context.t('help-hotline-text', { version }),
    '',
    context.t('help-bot-version', { version }),
  ].join('\n');

/**
 * Returns the message displayed when a user uses /start in a private chat.
 * @param context - Grammy bot context.
 * @returns The formatted start message string for private chats.
 */
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
 * Returns the message displayed when a user uses /start in a group chat.
 * @param context - Grammy bot context.
 * @param root0 - Group start message properties.
 * @param root0.adminsString - Optional formatted string of admin mentions.
 * @param root0.isAdmin - Whether the bot currently has admin rights.
 * @param root0.canDelete - Whether the bot can delete messages.
 * @param root0.user - The display name of the user.
 * @param root0.userId - The Telegram user ID.
 * @returns The formatted group start message string.
 */
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

/**
 * Returns the message displayed when the bot is invited to a channel.
 * @param context - Grammy bot context.
 * @param root0 - Generic bot properties.
 * @param root0.botName - The bot's username.
 * @returns The formatted channel start message string.
 */
export const getStartChannelMessage = (context: GrammyContext, { botName }: GenericBotProperties) =>
  context.t('start-channel-message', { botName, helpChat });

export interface BotJoinMessageProperties {
  adminsString?: string;
  isAdmin?: boolean;
  canDelete: boolean;
}

/**
 * Returns the message displayed when the bot is invited to a group.
 * @param context - Grammy bot context.
 * @param root0 - Bot join message properties.
 * @param root0.adminsString - Optional formatted string of admin mentions.
 * @param root0.isAdmin - Whether the bot has admin rights.
 * @param root0.canDelete - Whether the bot can delete messages.
 * @returns The formatted bot-join message string.
 */
export const getBotJoinMessage = (context: GrammyContext, { adminsString, isAdmin = false, canDelete }: BotJoinMessageProperties) =>
  [
    context.t('start-message-atom'),
    '',
    getGroupStartMessage(context, { adminsString, isAdmin, canDelete, user: undefined, userId: undefined }).trim(),
  ].join('\n');
