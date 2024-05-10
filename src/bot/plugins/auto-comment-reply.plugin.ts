import type { Context, Middleware, RawApi } from 'grammy';
import type { Methods, Payload } from 'grammy/out/core/client';

import { TELEGRAM_USER_ID } from '../../const';

const METHODS = new Set<Methods<RawApi>>([
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

export function autoCommentReply<C extends Context>(): Middleware<C> {
  return async (context, next) => {
    const isReplyToChannelMessage = context.msg?.reply_to_message?.from?.id === TELEGRAM_USER_ID;

    if (isReplyToChannelMessage) {
      context.api.config.use(async (previous, method, payload, signal) => {
        const chatId = payload && typeof payload === 'object' && (payload as Payload<'sendMessage', RawApi>).chat_id;

        if (METHODS.has(method) && chatId === context.msg?.chat.id) {
          Object.assign(payload, { reply_to_message_id: context.msg?.reply_to_message?.message_id });
        }

        return previous(method, payload, signal);
      });
    }

    return next();
  };
}
