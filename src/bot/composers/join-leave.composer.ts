import type { ChatMember } from '@grammyjs/types/manage';
import { Composer } from 'grammy';

import type { GrammyContext } from '../../types';
import { onlyNotDeletedFilter, onlyWhenBotAdminFilter } from '../filters';

/**
 * @description Remove join and leave messages from chat
 * */
export const getJoinLeaveComposer = () => {
  const joinLeaveComposer = new Composer<GrammyContext>();

  joinLeaveComposer
    .filter((context) => onlyWhenBotAdminFilter(context))
    // Filter that feature is enabled
    .filter((context) => !context.chatSession.chatSettings.disableDeleteServiceMessage)
    // Filter if the message is already deleted
    .filter((context) => onlyNotDeletedFilter(context))
    // Queries to filter
    .on([':new_chat_members', ':left_chat_member'])
    // Filter if the bot is not left chat member
    .filter((context) => {
      const leftStatuses = new Set<ChatMember['status']>(['left', 'kicked']);

      return !(context.myChatMember && leftStatuses.has(context.myChatMember?.new_chat_member.status || 'left'));
    })
    // Delete message
    .use(async (context, next) => {
      await context.deleteMessage();
      return next();
    });

  return { joinLeaveComposer };
};
