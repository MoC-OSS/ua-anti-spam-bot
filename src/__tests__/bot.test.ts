import type { Bot } from 'grammy';

// eslint-disable-next-line jest/no-mocks-import
import { realSwindlerMessage } from '../__mocks__/bot.mocks';
import { getBot } from '../bot';
import type { OutgoingRequests } from '../testing';
import { MessagePrivateMockUpdate, prepareBotForTesting } from '../testing';
import type { GrammyContext } from '../types';

let outgoingRequests: OutgoingRequests;
let bot: Bot<GrammyContext>;

describe('e2e bot testing', () => {
  beforeAll(async () => {
    bot = await getBot();
    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: {},
    });
  }, 15_000);

  beforeEach(() => {
    outgoingRequests.clear();
  });

  describe('check regular message', () => {
    it('should not remove a regular message', async () => {
      const update = new MessagePrivateMockUpdate('regular message').build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.requests).toHaveLength(2);
    });

    it('should remove a swindler message', async () => {
      const update = new MessagePrivateMockUpdate(realSwindlerMessage).build();
      await bot.handleUpdate(update);

      const [sendMessageRequest, deleteRequest] = outgoingRequests.getTwoLast();

      expect(deleteRequest?.method).toEqual('deleteMessage');
      expect(sendMessageRequest?.method).toEqual('sendMessage');
      expect(outgoingRequests.requests).toHaveLength(5);
    });
  });
});
