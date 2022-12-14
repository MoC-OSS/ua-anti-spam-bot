import { Bot } from 'grammy';

import type { OutgoingRequests } from '../../testing';
import { MessagePrivateMockUpdate, prepareBotForTesting } from '../../testing';
import type { GrammyContext } from '../../types';
import { sleep } from '../../utils';

import { selfDestructedReply } from './self-destructed.plugin';

let outgoingRequests: OutgoingRequests;
const bot = new Bot<GrammyContext>('mock');

describe('selfDestructedReply', () => {
  beforeAll(async () => {
    bot.use(selfDestructedReply(0));

    bot.on(':text', (context) => context.replyWithSelfDestructed('test'));

    const update = new MessagePrivateMockUpdate('test');

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      sendMessage: {
        chat: update.genericPrivateChat,
        message_id: update.genericUpdateId,
      },
    });
  }, 5000);

  beforeEach(() => {
    outgoingRequests.clear();
  });

  it('should delete message after specified time', async () => {
    const update = new MessagePrivateMockUpdate('test').build();
    await bot.handleUpdate(update);

    // We wait for event loop to resolve the previous request
    await sleep(0);

    const [sendMessageRequest, deleteMessageRequest] = outgoingRequests.getTwoLast<'sendMessage', 'deleteMessage'>();

    expect(outgoingRequests.length).toEqual(2);
    expect(sendMessageRequest?.method).toEqual('sendMessage');
    expect(deleteMessageRequest?.method).toEqual('deleteMessage');
  });

  it('should not delete immediately', async () => {
    const update = new MessagePrivateMockUpdate('test').build();
    await bot.handleUpdate(update);

    // We don't wait so there are only 1 request should be
    // await sleep(0);

    const sendMessageRequest = outgoingRequests.getLast<'sendMessage'>();

    expect(outgoingRequests.length).toEqual(1);
    expect(sendMessageRequest?.method).toEqual('sendMessage');
  });
});
