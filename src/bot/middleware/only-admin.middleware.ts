import type { Chat, ChatMember } from '@grammyjs/types/manage';
import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { logSkipMiddleware } from '../../utils';

export const onlyAdmin = async (context: GrammyContext, next: NextFunction) => {
  // No chat = no service
  if (!context.chat) {
    logSkipMiddleware(context, 'User is not admin');
    return;
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
    return;
  }

  /**
   * Check the member status
   *
   * @description
   * 'creator', 'administrator' - for valid statuses.
   * 'left' - for anonymous admins when bot is not admin.
   * */
  const adminStatuses = new Set<ChatMember['status']>(['creator', 'administrator', 'left']);
  const userStatuses = new Set<ChatMember['status']>(['member']);

  const chatMember = await context.getChatMember(context.from.id);
  if (adminStatuses.has(chatMember.status)) {
    return next();
  }

  // Regular user
  if (userStatuses.has(chatMember.status)) {
    logSkipMiddleware(context, 'User is a regular member');
    return;
  }

  logSkipMiddleware(context, 'User is neither admin nor regular');
};
