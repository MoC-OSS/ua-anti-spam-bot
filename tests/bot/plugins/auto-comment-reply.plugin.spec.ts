import { Bot } from 'grammy';
import type { Update } from 'grammy/out/types';

import { autoCommentReply } from '@bot/plugins/auto-comment-reply.plugin';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import { prepareBotForTesting } from '@testing/prepare';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';

describe('autoCommentReply', () => {
  let outgoingRequests: OutgoingRequests;
  let bot: Bot<GrammyContext>;

  beforeEach(async () => {
    bot = new Bot<GrammyContext>('mock');
    bot.use(autoCommentReply());
    bot.on(':text', (context) => context.reply('test'));

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot);
  });

  afterEach(() => {
    outgoingRequests.clear();
  });

  it('should call next and NOT add reply_to_message_id when message is not a reply to channel', async () => {
    const update = new MessageMockUpdate('test').build();

    await bot.handleUpdate(update);

    const lastRequest = outgoingRequests.getLast<'sendMessage'>();

    expect(lastRequest?.method).toBe('sendMessage');
    // eslint-disable-next-line sonarjs/deprecation
    expect(lastRequest?.payload?.reply_to_message_id).toBeUndefined();
  });

  it('should call next and add reply_to_message_id when message is a reply to channel (from.id === 777000)', async () => {
    const update = new MessageMockUpdate('test').buildOverwrite({
      message: {
        reply_to_message: {
          message_id: 100,
          from: { id: 777_000, is_bot: true, first_name: 'Telegram', username: 'telegram' },
          chat: { id: 202_212, type: 'supergroup', title: 'GrammyMock' },
          date: Math.floor(Date.now() / 1000),
          text: 'channel post',
        } as any,
      },
    }) as unknown as Update;

    await bot.handleUpdate(update);

    const lastRequest = outgoingRequests.getLast<'sendMessage'>();

    expect(lastRequest?.method).toBe('sendMessage');
    // eslint-disable-next-line sonarjs/deprecation
    expect(lastRequest?.payload?.reply_to_message_id).toBe(100);
  });
});
