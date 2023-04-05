import { Bot } from 'grammy';

import { logsChat } from '../../creator';
import type { OutgoingRequests } from '../../testing';
import { MessageSuperGroupMockUpdate, prepareBotForTesting } from '../../testing';
import type { GrammyContext } from '../../types';

import { disableLogsChatTransformer } from './disable-logs-chat.transformer';

let outgoingRequests: OutgoingRequests;
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

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot);
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      isEnabled = true;
    });

    it('should not send request if it has been sent into logs chat', async () => {
      const updateConstructor = new MessageSuperGroupMockUpdate('test');
      const update = updateConstructor.buildOverwrite({
        message: {
          chat: { ...updateConstructor.genericSuperGroup, id: logsChat },
        },
      });

      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      isEnabled = false;
    });

    it('should not send request if it has been sent into logs chat', async () => {
      const updateConstructor = new MessageSuperGroupMockUpdate('test');
      const update = updateConstructor.buildOverwrite({
        message: {
          chat: { ...updateConstructor.genericSuperGroup, id: logsChat },
        },
      });

      await bot.handleUpdate(update);

      const apiCall = outgoingRequests.getLast<'sendMessage'>();

      expect(outgoingRequests.length).toEqual(1);
      expect(apiCall?.method).toEqual('sendMessage');
    });
  });
});
