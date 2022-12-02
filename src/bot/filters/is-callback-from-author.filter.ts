import { groupAnonymousBotId } from '../../creator';
import type { GrammyFilter } from '../../types';

/**
 * Returns true if callback's message is replying to user's message and the same user pressed the button
 * */
export const isCallbackFromAuthorFilter: GrammyFilter = (context) => {
  // Not callback query
  if (!context.callbackQuery) {
    return false;
  }

  const isFromUser = context.callbackQuery.from.id === context.callbackQuery.message?.reply_to_message?.from?.id;
  const isFromGroupAnonymousBot = context.callbackQuery.message?.reply_to_message?.from?.id === groupAnonymousBotId;

  return isFromUser || isFromGroupAnonymousBot;
};
