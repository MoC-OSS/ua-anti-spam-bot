import type { Chat, ChatMember } from '@grammyjs/types/manage';
import type { NextFunction } from 'grammy';

import type { GrammyContext } from '@app-types/context';

import { logSkipMiddleware } from '@utils/generic.util';

/**
 * Guards the middleware chain so only chat admins (or channel/private chat users) can proceed.
 * Short-circuits with no response for non-admin users.
 * @param context
 * @param next
 */
export const onlyAdmin = async (context: GrammyContext, next: NextFunction) => {
  // No chat = no service
  if (!context.chat) {
    logSkipMiddleware(context, 'User is not admin');

    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  }

  // Channels and private chats are only postable by admins
  const defaultAdminChatType = new Set<Chat['type']>(['channel', 'private']);

  if (defaultAdminChatType.has(context.chat.type)) {
    return next();
  }

  // Anonymous users are always admins
  if (context.from?.username === 'GroupAnonymousBot') {
    return next();
  }

  // Surely not an admin
  if (!context.from?.id) {
    logSkipMiddleware(context, 'User is not admin');

    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  }

  /**
   * Check the member status
   * @description
   * 'creator', 'administrator' - for valid statuses.
   * 'left' - for anonymous admins when bot is not admin.
   */
  const adminStatuses = new Set<ChatMember['status']>(['creator', 'administrator', 'left']);
  const userStatuses = new Set<ChatMember['status']>(['member']);

  const chatMember = await context.getChatMember(context.from.id);

  if (adminStatuses.has(chatMember.status)) {
    return next();
  }

  // Regular user
  if (userStatuses.has(chatMember.status)) {
    logSkipMiddleware(context, 'User is a regular member');

    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  }

  logSkipMiddleware(context, 'User is neither admin nor regular');

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
};
