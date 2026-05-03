import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { autoCommentReply } from '@bot/plugins/auto-comment-reply.plugin';

import type { GrammyContext } from '@app-types/context';

describe('autoCommentReply', () => {
  let chats: Chats<GrammyContext>;
  let user: User<GrammyContext>;
  let group: Supergroup<GrammyContext>;
  let bot: Bot<GrammyContext>;

  beforeEach(async () => {
    bot = new Bot<GrammyContext>('mock');
    bot.use(autoCommentReply());
    bot.on(':text', (context) => context.reply('test'));

    ({ chats } = await prepareBot<GrammyContext>(bot));
    user = chats.newUser();
    group = chats.newSupergroup();
  });

  afterEach(() => {
    chats.outgoing.clear();
    user.replies.clear();
  });

  it('should call next and NOT add reply_to_message_id when message is not a reply to channel', async () => {
    await user.sendText('test', { chat: group });

    const lastRequest = chats.outgoing.getLast<'sendMessage'>();

    expect(lastRequest?.method).toBe('sendMessage');
    // eslint-disable-next-line sonarjs/deprecation
    expect(lastRequest?.payload?.reply_to_message_id).toBeUndefined();
  });

  it('should call next and add reply_to_message_id when message is a reply to channel (from.id === 777000)', async () => {
    await user.sendText('test', {
      chat: group,
      reply_to_message: {
        message_id: 100,
        from: { id: 777_000, is_bot: true, first_name: 'Telegram', username: 'telegram' },
        chat: { id: group.id, type: 'supergroup' as const, title: group.title },
        date: Math.floor(Date.now() / 1000),
        text: 'channel post',
      } as any,
    });

    const lastRequest = chats.outgoing.getLast<'sendMessage'>();

    expect(lastRequest?.method).toBe('sendMessage');
    // eslint-disable-next-line sonarjs/deprecation
    expect(lastRequest?.payload?.reply_to_message_id).toBe(100);
  });
});
