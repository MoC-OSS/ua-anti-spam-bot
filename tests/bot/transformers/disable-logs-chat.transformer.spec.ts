import { Bot } from 'grammy';
import type { Chats, Supergroup, User } from 'grammy-testing';
import { prepareBot } from 'grammy-testing';

import { logsChat } from '@bot/creator';
import { disableLogsChatTransformer } from '@bot/transformers/disable-logs-chat.transformer';

import type { GrammyContext } from '@app-types/context';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let logsGroup: Supergroup<GrammyContext>;
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

    logsGroup = chats.newSupergroup({ id: logsChat });
    user = chats.newUser();
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      isEnabled = true;
    });

    it('should not send request if it has been sent into logs chat', async () => {
      await user.sendText('test', { chat: logsGroup });

      expect(chats.outgoing.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      isEnabled = false;
    });

    it('should not send request if it has been sent into logs chat', async () => {
      await user.sendText('test', { chat: logsGroup });

      const apiCall = chats.outgoing.getLast<'sendMessage'>();

      expect(chats.outgoing.length).toEqual(1);
      expect(apiCall?.method).toEqual('sendMessage');
    });
  });
});
