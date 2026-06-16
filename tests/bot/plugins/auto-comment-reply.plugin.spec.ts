import { Bot } from 'grammy';
import type { Chats, Supergroup, User } from 'grammy-testing';
import { prepareBot } from 'grammy-testing';

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
    chats.clear();
  });

  it('should call next and NOT add reply_to_message_id when message is not a reply to channel', async () => {
    await user.sendText('test', { chat: group });

    const lastRequest = chats.outgoing.getLast<'sendMessage'>();

    expect(lastRequest?.method).toBe('sendMessage');
    // eslint-disable-next-line sonarjs/deprecation
    expect(lastRequest?.payload?.reply_to_message_id).toBeUndefined();
  });

  it('should call next and add reply_to_message_id when message is a reply to channel (from.id === 777000)', async () => {
    const relay = await group.postRelayMessage('channel post');

    chats.clear();

    await user.sendText('test', { chat: group, reply_to_message: relay });

    const lastRequest = chats.outgoing.getLast<'sendMessage'>();

    expect(lastRequest?.method).toBe('sendMessage');
    // eslint-disable-next-line sonarjs/deprecation
    expect(lastRequest?.payload?.reply_to_message_id).toBe(relay.message_id);
  });
});
