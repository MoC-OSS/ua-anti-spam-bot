import type { RawApi, Transformer } from 'grammy';
import type { Payload } from 'grammy/out/core/client';

import { logsChat, secondLogsChat } from '@bot/creator';

import type { RealApiMethodKeys } from '@testing/outgoing-requests';

import { logger } from '@utils/logger.util';

/**
 * API transformer that intercepts send methods targeting the logs chat
 * and suppresses them, useful for testing without sending real log messages.
 */
export const disableLogsChatTransformer: Transformer = (previous, method, payload, signal) => {
  const sendMethods = new Set<RealApiMethodKeys>([
    'sendMessage',
    'sendAudio',
    'sendDice',
    'sendAnimation',
    'sendChatAction',
    'sendContact',
    'sendDocument',
    'sendGame',
    'sendInvoice',
    'sendLocation',
    'sendMediaGroup',
    'sendPhoto',
    'sendPoll',
    'sendSticker',
    'sendVenue',
    'sendVideo',
    'sendVideoNote',
    'sendVoice',
  ]);

  const chatId = payload && typeof payload === 'object' && (payload as Payload<'sendMessage', RawApi>).chat_id;

  const isSendMethod = sendMethods.has(method);
  const isLogsChatRequest = chatId === logsChat || chatId === secondLogsChat;

  if (isSendMethod && isLogsChatRequest) {
    logger.info({ payload }, `Disabled log into logs chat. Method: ${method}.`);

    return Promise.resolve({ ok: true, result: true as never });
  }

  return previous(method, payload, signal);
};
