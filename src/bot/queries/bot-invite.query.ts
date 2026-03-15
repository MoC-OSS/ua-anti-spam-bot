import type { ChatAdministratorRights, ChatMember } from '@grammyjs/types/manage';

import { getBotJoinMessage } from '@message';

import type { GrammyQueryMiddleware } from '@app-types/context';

import { telegramUtility } from '@utils/util-instances.util';

/**
 * Handles the bot being invited to a group or channel.
 * Resets removal state and sends a welcome/setup message to the chat admins.
 */
export const botInviteQuery: GrammyQueryMiddleware<'my_chat_member'> = async (context, next) => {
  const newStatuses = new Set<ChatMember['status']>(['member', 'administrator']);
  const oldStatuses = new Set<ChatMember['status']>(['left', 'kicked']);

  const isAdmin = context.myChatMember.new_chat_member.status === 'administrator';
  const canDelete = (context.myChatMember.new_chat_member as ChatAdministratorRights).can_delete_messages;

  // Invite as a normal member or admin
  if (oldStatuses.has(context.myChatMember.old_chat_member.status) && newStatuses.has(context.myChatMember.new_chat_member.status)) {
    context.chatSession.botRemoved = false;
    const { adminsString } = await telegramUtility.getChatAdmins(context, context.chat.id);

    await context.reply(getBotJoinMessage(context, { adminsString, isAdmin, canDelete }), { parse_mode: 'HTML' });
  }

  return next();
};
