import type { GrammyMiddleware } from '@app-types/context';

/**
 * Delete user entered message
 * @param reason - why bot could not delete the message
 * @returns A Grammy middleware function that deletes the message or replies with the reason
 */
export const deleteMessageMiddleware =
  (reason: string): GrammyMiddleware =>
  (context, next) => {
    if (context.chatSession.isBotAdmin) {
      return context
        .deleteMessage()
        .then(next)
        .catch(() => (reason ? context.reply(reason, { parse_mode: 'HTML' }) : null));
    }

    return context.reply(reason, { parse_mode: 'HTML' });
  };
