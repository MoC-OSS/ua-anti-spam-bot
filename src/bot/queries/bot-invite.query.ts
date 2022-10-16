import type { Bot } from 'grammy';

import { getBotJoinMessage } from '../../message';
import type { GrammyContext, GrammyQueryMiddleware } from '../../types';
import { telegramUtil } from '../../utils';

export const botInviteQuery =
  (bot: Bot<GrammyContext>): GrammyQueryMiddleware<'my_chat_member'> =>
  async (context, next) => {
    if (context.myChatMember.old_chat_member.status === 'left' && context.myChatMember.new_chat_member.status === 'member') {
      const { adminsString } = await telegramUtil.getChatAdmins(bot, context.chat.id);
      await context.replyWithHTML(getBotJoinMessage({ adminsString, isAdmin: context.chatSession.isBotAdmin }));
    }

    return next();
  };
