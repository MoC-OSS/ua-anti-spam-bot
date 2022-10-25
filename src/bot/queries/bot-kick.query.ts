import type { ChatMember } from '@grammyjs/types/manage';

import type { GrammyQueryMiddleware } from '../../types';

export const botKickQuery: GrammyQueryMiddleware<'my_chat_member'> = (context, next) => {
  const oldStatuses = new Set<ChatMember['status']>(['left', 'kicked']);

  if (oldStatuses.has(context.myChatMember.new_chat_member.status)) {
    context.chatSession.botRemoved = true;
    delete context.chatSession.isBotAdmin;
    delete context.chatSession.botAdminDate;
  }

  return next();
};
