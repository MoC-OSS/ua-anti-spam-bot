import type { GrammyMiddleware } from '../../types';

/**
 * Delete user entered message
 *
 * @param reason - why bot could not delete the message
 * */
export const deleteMessageMiddleware =
  (reason: string): GrammyMiddleware =>
  (context, next) => {
    if (context.chatSession.isBotAdmin) {
      return context
        .deleteMessage()
        .then(next)
        .catch(() => (reason ? context.replyWithHTML(reason) : null));
    }

    return context.replyWithHTML(reason);
  };
