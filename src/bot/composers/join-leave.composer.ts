import { Composer } from 'grammy';

import type { GrammyContext } from '../../types';
import { onlyNotDeletedFilter } from '../filters';

/**
 * @description Remove join and leave messages from chat
 * */
export const getJoinLeaveComposer = () => {
  const joinLeaveComposer = new Composer<GrammyContext>();

  joinLeaveComposer
    // Filter that feature is enabled
    .filter((context) => !context.chatSession.chatSettings.disableDeleteServiceMessage)
    // Filter if the message is already deleted
    .filter((context) => onlyNotDeletedFilter(context))
    // Queries to filter
    .on([':new_chat_members', ':left_chat_member'])
    // Delete message
    .use(async (context, next) => {
      await context.deleteMessage();
      return next();
    });

  return { joinLeaveComposer };
};
