import type { Chats, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { sleep } from '@utils/generic.util';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let bot: Bot<GrammyContext>;

const customPluginCallback = vi.fn(() => Promise.resolve());

const mockSendMessageResponse = {
  message_id: 10_000,
  date: Math.floor(Date.now() / 1000),
  chat: { id: 1_111_111, type: 'private' as const, first_name: 'Mock' },
};

describe('selfDestructedReply', () => {
  describe('default plugin', () => {
    beforeAll(async () => {
      bot = new Bot<GrammyContext>('mock');
      bot.use(selfDestructedReply(0));

      bot.on(':text', (context) => context.replyWithSelfDestructed('test'));

      ({ chats } = await prepareBot<GrammyContext>(bot, {
        responses: {
          sendMessage: mockSendMessageResponse,
        },
      }));

      user = chats.newUser();
    }, 5000);

    beforeEach(() => {
      chats.clear();
    });

    it('should delete message after specified time', async () => {
      await user.sendText('test');

      await sleep(0);

      const [sendMessageRequest, deleteMessageRequest] = chats.outgoing.getTwoLast<'sendMessage', 'deleteMessage'>();

      expect(chats.outgoing.length).toEqual(2);
      expect(sendMessageRequest?.method).toEqual('sendMessage');
      expect(deleteMessageRequest?.method).toEqual('deleteMessage');
    });

    it('should not delete immediately', async () => {
      await user.sendText('test');

      const sendMessageRequest = chats.outgoing.getLast<'sendMessage'>();

      expect(chats.outgoing.length).toEqual(1);
      expect(sendMessageRequest?.method).toEqual('sendMessage');
    });
  });

  describe('custom plugin params', () => {
    beforeAll(async () => {
      bot = new Bot<GrammyContext>('mock');
      bot.use(selfDestructedReply(0, customPluginCallback));

      bot.on(':text', (context) => context.replyWithSelfDestructed('test'));

      ({ chats } = await prepareBot<GrammyContext>(bot, {
        responses: {
          sendMessage: mockSendMessageResponse,
        },
      }));

      user = chats.newUser();
    }, 5000);

    it('should call custom callback if passed and dont call extra requests', async () => {
      await user.sendText('test');
      await sleep(0);

      const sendMessageRequest = chats.outgoing.getLast<'sendMessage'>();

      expect(chats.outgoing.length).toEqual(1);
      expect(sendMessageRequest?.method).toEqual('sendMessage');
      expect(customPluginCallback).toHaveBeenCalled();
    });
  });
});
