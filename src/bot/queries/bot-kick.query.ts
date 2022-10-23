import type { GrammyQueryMiddleware } from '../../types';

export const botKickQuery: GrammyQueryMiddleware<'my_chat_member'> = (context, next) => {
  if (context.myChatMember.new_chat_member.status === 'left') {
    context.chatSession.botRemoved = true;
    delete context.chatSession.isBotAdmin;
    delete context.chatSession.botAdminDate;
  }

  return next();
};
