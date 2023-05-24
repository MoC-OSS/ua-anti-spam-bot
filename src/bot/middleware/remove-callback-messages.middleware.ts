import type { CallbackQueryMiddleware } from 'grammy/out/composer';

import type { GrammyContext } from '../../types';

/**
 * Removes callback main message and reply message if existing
 * */
export const removeCallbackMessagesMiddleware: CallbackQueryMiddleware<GrammyContext> = async (context, next) => {
  const chatId = context.chat?.id;
  const repliedMessageId = context.callbackQuery.message?.reply_to_message?.message_id;
  if (chatId && repliedMessageId) {
    await context.api.deleteMessage(chatId, repliedMessageId);
  }

  await context.deleteMessage();

  return next();
};
