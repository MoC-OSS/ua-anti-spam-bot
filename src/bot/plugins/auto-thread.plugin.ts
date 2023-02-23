/**
 * Source
 * @see https://github.com/grammyjs/auto-thread/blob/main/src/auto-thread.ts
 * */
import type { Context, Middleware } from 'grammy';

const METHODS = new Set([
  'sendMessage',
  'sendPhoto',
  'sendVideo',
  'sendAnimation',
  'sendAudio',
  'sendDocument',
  'sendSticker',
  'sendVideoNote',
  'sendVoice',
  'sendLocation',
  'sendVenue',
  'sendContact',
  'sendPoll',
  'sendDice',
  'sendInvoice',
  'sendGame',
  'sendMediaGroup',
  'copyMessage',
  'forwardMessage',
]);

export function autoThread<C extends Context>(): Middleware<C> {
  return async (context, next) => {
    const messageThreadId = context.msg?.message_thread_id;

    if (messageThreadId !== undefined) {
      context.api.config.use(async (previous, method, payload, signal) => {
        if (!('message_thread_id' in payload) && METHODS.has(method)) {
          Object.assign(payload, { message_thread_id: messageThreadId });
        }

        return previous(method, payload, signal);
      });
    }

    return next();
  };
}
