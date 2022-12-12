import type { GrammyFilter } from '../../types';

/**
 * @returns {true} when bot is admin
 * */
export const onlyWhenBotAdminFilter: GrammyFilter = (context) => {
  if (context.chat?.type === 'private') {
    return true;
  }

  const isMessageAfterBotAdmin = (context.msg?.date || 0) * 1000 > +new Date(context.chatSession.botAdminDate || 0);

  return !context.chatSession.botRemoved && !!context.chatSession.isBotAdmin && isMessageAfterBotAdmin;
};
