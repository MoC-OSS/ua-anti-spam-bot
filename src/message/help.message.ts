import type { GrammyContext } from '@app-types/context';

import { helpChat } from '../creator';

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
    context.t('help-hotline-text'),
    '',
    'Детальніше за командою /hotline_security',
  ].join('\n');

/**
 * Returns the message displayed when a user uses /start in a private chat.
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
 */
export const getBotJoinMessage = (context: GrammyContext, { adminsString, isAdmin = false, canDelete }: BotJoinMessageProperties) =>
  [
    context.t('start-message-atom'),
    '',
    getGroupStartMessage(context, { adminsString, isAdmin, canDelete, user: undefined, userId: undefined }).trim(),
  ].join('\n');
