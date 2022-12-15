import type { RawApi } from 'grammy';
import { Bot } from 'grammy';

// eslint-disable-next-line jest/no-mocks-import
import { realSwindlerMessage } from '../__mocks__/bot.mocks';
import { getBot } from '../bot';
import { environmentConfig } from '../config';
import { logsChat } from '../creator';
import type { OutgoingRequests } from '../testing';
import { MessagePrivateMockUpdate, prepareBotForTesting } from '../testing';
import { mockChatSession, mockSession } from '../testing-main';
import type { GrammyContext } from '../types';

/**
 * Enable unit testing
 * */
environmentConfig.UNIT_TESTING = true;

let outgoingRequests: OutgoingRequests;
let bot: Bot<GrammyContext>;

const { mockSessionMiddleware } = mockSession({});
const { mockChatSessionMiddleware } = mockChatSession({});

describe('e2e bot testing', () => {
  beforeAll(async () => {
    const initialBot = new Bot<GrammyContext>(environmentConfig?.BOT_TOKEN);

    // Add mock session data
    initialBot.use(mockSessionMiddleware);
    initialBot.use(mockChatSessionMiddleware);

    bot = await getBot(initialBot);
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

    it('should remove a swindler message and notify for first swindler in several hours', async () => {
      const update = new MessagePrivateMockUpdate(realSwindlerMessage).build();
      await bot.handleUpdate(update);

      const [sendLogsMessageRequest, sendSwindlersMessageRequest, deleteRequest] = outgoingRequests.getThreeLast<
        'sendMessage',
        'sendMessage',
        'deleteMessage'
      >();

      expect(sendLogsMessageRequest?.method).toEqual('sendMessage');
      expect(sendLogsMessageRequest?.payload.chat_id).toEqual(logsChat);
      expect(sendSwindlersMessageRequest?.method).toEqual('sendMessage');
      expect(deleteRequest?.method).toEqual('deleteMessage');
      expect(outgoingRequests.requests).toHaveLength(6);
    });

    it('should remove a swindler message and dont notify after already notified', async () => {
      const update = new MessagePrivateMockUpdate(realSwindlerMessage).build();
      await bot.handleUpdate(update);

      const [anyRequest, sendLogsMessageRequest, deleteRequest] = outgoingRequests.getThreeLast<
        keyof RawApi,
        'sendMessage',
        'deleteMessage'
      >();

      expect(anyRequest?.method).not.toEqual('sendMessage');
      expect(deleteRequest?.method).toEqual('deleteMessage');
      expect(sendLogsMessageRequest?.method).toEqual('sendMessage');
      expect(sendLogsMessageRequest?.payload.chat_id).toEqual(logsChat);
      expect(outgoingRequests.requests).toHaveLength(5);
    });
  });
});
