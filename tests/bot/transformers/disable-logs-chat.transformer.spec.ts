import type { Chats } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { logsChat } from '@bot/creator';
import { disableLogsChatTransformer } from '@bot/transformers/disable-logs-chat.transformer';

import type { GrammyContext } from '@app-types/context';

let chats: Chats<GrammyContext>;
const bot = new Bot<GrammyContext>('mock');

let isEnabled = true;

describe('disableLogsChatTransformer', () => {
  beforeAll(async () => {
    bot.use((context, next) => {
      if (isEnabled) {
        context.api.config.use(disableLogsChatTransformer);
      }

      return next();
    });

    bot.on('message', (context) => context.api.sendMessage(logsChat, context.msg.text || 'test'));

    ({ chats } = await prepareBot<GrammyContext>(bot));
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      isEnabled = true;
    });

    it('should not send request if it has been sent into logs chat', async () => {
      await bot.handleUpdate({
        update_id: 1,
        message: {
          message_id: 1365,
          date: Math.floor(Date.now() / 1000),
          chat: { id: logsChat, type: 'supergroup' as const, title: 'GrammyMock' },
          from: { id: 1_111_111, first_name: 'GrammyMock FirstName', is_bot: false },
          text: 'test',
        },
      });

      expect(chats.outgoing.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      isEnabled = false;
    });

    it('should not send request if it has been sent into logs chat', async () => {
      await bot.handleUpdate({
        update_id: 1,
        message: {
          message_id: 1365,
          date: Math.floor(Date.now() / 1000),
          chat: { id: logsChat, type: 'supergroup' as const, title: 'GrammyMock' },
          from: { id: 1_111_111, first_name: 'GrammyMock FirstName', is_bot: false },
          text: 'test',
        },
      });

      const apiCall = chats.outgoing.getLast<'sendMessage'>();

      expect(chats.outgoing.length).toEqual(1);
      expect(apiCall?.method).toEqual('sendMessage');
    });
  });
});
