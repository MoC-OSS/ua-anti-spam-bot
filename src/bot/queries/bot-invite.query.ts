import type { ChatAdministratorRights, ChatMember } from '@grammyjs/types/manage';
import type { Bot } from 'grammy';

import { getBotJoinMessage } from '../../message';
import type { GrammyContext, GrammyQueryMiddleware } from '../../types';
import { telegramUtil } from '../../utils';

export const botInviteQuery =
  (bot: Bot<GrammyContext>): GrammyQueryMiddleware<'my_chat_member'> =>
  async (context, next) => {
    const newStatuses = new Set<ChatMember['status']>(['member', 'administrator']);
    const oldStatuses = new Set<ChatMember['status']>(['left', 'kicked']);

    const isAdmin = context.myChatMember.new_chat_member.status === 'administrator';
    const canDelete = (context.myChatMember.new_chat_member as ChatAdministratorRights).can_delete_messages;

    // Invite as a normal member or admin
    if (oldStatuses.has(context.myChatMember.old_chat_member.status) && newStatuses.has(context.myChatMember.new_chat_member.status)) {
      const { adminsString } = await telegramUtil.getChatAdmins(bot, context.chat.id);
      await context.replyWithHTML(getBotJoinMessage({ adminsString, isAdmin, canDelete }));
    }

    return next();
  };
