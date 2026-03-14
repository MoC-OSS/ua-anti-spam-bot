import type { RawApi, Transformer } from 'grammy';
import type { Payload } from 'grammy/out/core/client';

import type { RealApiMethodKeys } from '@testing/';

import { logsChat, secondLogsChat } from '../../creator';

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
    console.info(`Disabled log into logs chat. Method: ${method}. Payload:`, payload);

    return Promise.resolve({ ok: true, result: true as never });
  }

  return previous(method, payload, signal);
};
