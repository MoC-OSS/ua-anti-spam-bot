import type { RawApi, Transformer } from 'grammy';
import type { Payload } from 'grammy/out/core/client';

import { logsChat, secondLogsChat } from '../../creator';
import type { RealApiMethodKeys } from '../../testing';

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return Promise.resolve({ ok: true, result: true as never });
  }

  return previous(method, payload, signal);
};
