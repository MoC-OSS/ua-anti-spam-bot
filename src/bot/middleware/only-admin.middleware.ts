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
  if (['channel', 'private'].includes(context.chat.type)) {
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
  // Check the member status
  const chatMember = await context.getChatMember(context.from.id);
  if (['creator', 'administrator'].includes(chatMember.status)) {
    return next();
  }
};
