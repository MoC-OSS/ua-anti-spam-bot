import { Bot } from 'grammy';

import { getStrategicComposer } from '@bot/composers/messages/strategic.composer';
import { i18n } from '@bot/i18n';
import { OnTextListener } from '@bot/listeners/on-text.listener';
import { parseText } from '@bot/middleware/parse-text.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import { prepareBotForTesting } from '@testing/prepare';
import { mockChatSession, mockSession } from '@testing/testing-main';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';

const { mockGetTrainingStartRank, mockGetTrainingChatWhitelist } = vi.hoisted(() => ({
  mockGetTrainingStartRank: vi.fn().mockResolvedValue(0.6),
  mockGetTrainingChatWhitelist: vi.fn().mockResolvedValue([]),
}));

vi.mock('@services/redis.service', () => ({
  redisService: {
    getTrainingStartRank: mockGetTrainingStartRank,
    getTrainingChatWhitelist: mockGetTrainingChatWhitelist,
  },
}));

vi.mock('@services/swindlers-google.service', () => ({
  swindlersGoogleService: {},
}));

const mockMessageHandler = {
  sanitizeMessage: vi.fn((context: GrammyContext, message: string) => message),
  getTensorRank: vi.fn().mockResolvedValue({ isSpam: false, rate: 0, tensor: 0.3, deleteRank: 0.9 }),
};

const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    disableDeleteMessage: false,
  },
  isLimitedDeletion: false,
  lastLimitedDeletionDate: undefined,
});

const { session, mockSessionMiddleware } = mockSession({
  isCurrentUserAdmin: false,
});

const onTextListener = new OnTextListener(bot, new Date(), mockMessageHandler as any);
const { strategicComposer } = getStrategicComposer({ onTextListener });

let outgoingRequests: OutgoingRequests;

describe('strategicComposer', () => {
  beforeAll(async () => {
    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(mockSessionMiddleware);
    bot.use(mockChatSessionMiddleware);
    bot.use(strategicComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: { invite_link: '' },
      getChatAdministrators: [],
    });
  }, 10_000);

  beforeEach(() => {
    outgoingRequests.clear();
    mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: false, tensor: 0.3, deleteRank: 0.9 });
    mockGetTrainingStartRank.mockResolvedValue(0.6);
    mockGetTrainingChatWhitelist.mockResolvedValue([]);
    chatSession.isLimitedDeletion = false;
    chatSession.lastLimitedDeletionDate = undefined;
    chatSession.chatSettings.disableDeleteMessage = false;
    session.isCurrentUserAdmin = false;
  });

  describe('no spam detected', () => {
    it('should call next() without any API calls when message is not spam', async () => {
      const update = new MessageMockUpdate('hello world').build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });

  describe('admin user', () => {
    it('should call next() without processing when user is admin and DEBUG is false', async () => {
      session.isCurrentUserAdmin = true;

      const update = new MessageMockUpdate('spam message').build();

      mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: true, tensor: 0.95, deleteRank: 0.5 });

      await bot.handleUpdate(update);

      // Admin bypass means no delete/reply
      expect(outgoingRequests.length).toEqual(0);
    });
  });

  describe('dataset branch (tensor in training range)', () => {
    it('should send to training chat when tensor is between startRank and deleteRank', async () => {
      // tensor: 0.7 > startRank: 0.6, and tensor: 0.7 < deleteRank: 0.9 → training message
      mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: false, tensor: 0.7, deleteRank: 0.9 });
      mockGetTrainingStartRank.mockResolvedValue(0.6);

      const update = new MessageMockUpdate('possibly spam text').build();

      await bot.handleUpdate(update);

      const methods = outgoingRequests.getMethods();

      expect(methods).toContain('sendMessage');
    });

    it('should NOT send to training chat when tensor is below startRank', async () => {
      mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: false, tensor: 0.4, deleteRank: 0.9 });
      mockGetTrainingStartRank.mockResolvedValue(0.6);

      const update = new MessageMockUpdate('clean message').build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });

    it('should NOT send to training chat when tensor equals deleteRank', async () => {
      mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: false, tensor: 0.9, deleteRank: 0.9 });
      mockGetTrainingStartRank.mockResolvedValue(0.6);

      const update = new MessageMockUpdate('clean message').build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });

    it('should NOT send to training chat when tensor is undefined', async () => {
      mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: false, tensor: undefined, deleteRank: 0.9 });
      mockGetTrainingStartRank.mockResolvedValue(0.6);

      const update = new MessageMockUpdate('clean message').build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });

  describe('spam detected (rep.rule is set)', () => {
    beforeEach(() => {
      mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: true, tensor: 0.95, deleteRank: 0.5 });
    });

    it('should delete message and send reply notification when delete succeeds', async () => {
      const update = new MessageMockUpdate('spam message').build();

      await bot.handleUpdate(update);

      const methods = outgoingRequests.getMethods();

      expect(methods).toContain('deleteMessage');
      expect(methods).toContain('sendMessage');
    });

    it('should delete message but NOT send reply when disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;

      const update = new MessageMockUpdate('spam message').build();

      await bot.handleUpdate(update);

      const methods = outgoingRequests.getMethods();

      expect(methods).toContain('deleteMessage');
      // No self-destructed reply
      expect(methods.filter((method) => method === 'sendMessage').length).toEqual(0);
    });

    it('should send to training chat when chat is in trainingChatWhitelist', async () => {
      // The mock update uses genericSuperGroup.id = 202_212
      mockGetTrainingChatWhitelist.mockResolvedValue(['202212']);

      const update = new MessageMockUpdate('spam message').build();

      await bot.handleUpdate(update);

      const methods = outgoingRequests.getMethods();

      // Should have: sendMessage (to training chat) + deleteMessage + sendMessage (reply)
      expect(methods).toContain('deleteMessage');
      const sendMessageCount = methods.filter((method) => method === 'sendMessage').length;

      expect(sendMessageCount).toBeGreaterThanOrEqual(2);
    });

    it('should NOT send to training chat when chat is not in trainingChatWhitelist', async () => {
      mockGetTrainingChatWhitelist.mockResolvedValue(['999999']);

      const update = new MessageMockUpdate('spam message').build();

      await bot.handleUpdate(update);

      const methods = outgoingRequests.getMethods();

      expect(methods).toContain('deleteMessage');
    });

    it('should NOT send to training chat when trainingChatWhitelist is null', async () => {
      mockGetTrainingChatWhitelist.mockResolvedValue(null);

      const update = new MessageMockUpdate('spam message').build();

      await bot.handleUpdate(update);

      const methods = outgoingRequests.getMethods();

      expect(methods).toContain('deleteMessage');
    });
  });

  describe('delete fails', () => {
    beforeEach(() => {
      mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: true, tensor: 0.95, deleteRank: 0.5 });
    });

    it('should send cannot-delete notice when delete fails and isLimitedDeletion is false', async () => {
      // Make deleteMessage fail
      const failBot = new Bot<GrammyContext>('mock-fail');

      const { chatSession: failChatSession, mockChatSessionMiddleware: failChatMiddleware } = mockChatSession({
        chatSettings: { disableDeleteMessage: false },
        isLimitedDeletion: false,
        lastLimitedDeletionDate: undefined,
      });

      const { mockSessionMiddleware: failSessionMiddleware } = mockSession({ isCurrentUserAdmin: false });

      const failOnTextListener = new OnTextListener(failBot, new Date(), mockMessageHandler as any);
      const { strategicComposer: failComposer } = getStrategicComposer({ onTextListener: failOnTextListener });

      failBot.use(i18n);
      failBot.use(selfDestructedReply());
      failBot.use(stateMiddleware);
      failBot.use(parseText);
      failBot.use(failSessionMiddleware);
      failBot.use(failChatMiddleware);
      failBot.use(failComposer);

      const failRequests = await prepareBotForTesting<GrammyContext>(failBot, {
        getChat: { invite_link: '' },
        getChatAdministrators: [
          {
            status: 'creator',
            user: { id: 1, is_bot: false, first_name: 'Admin', username: 'admin' },
            custom_title: '',
            is_anonymous: false,
          },
        ],
      });

      // Override the API transformer to fail deleteMessage
      failBot.api.config.use((previous, method, payload, signal) => {
        if (method === 'deleteMessage') {
          return Promise.resolve({ ok: false, error_code: 400, description: 'Bad Request' } as any);
        }

        return previous(method, payload, signal);
      });

      failChatSession.isLimitedDeletion = false;

      const update = new MessageMockUpdate('spam message').build();

      await failBot.handleUpdate(update);

      // getChatAdministrators + reply + sendMessage (logs) should be called
      const methods = failRequests.getMethods();

      expect(methods).toContain('getChatAdministrators');
    });

    it('should NOT send cannot-delete notice again when isLimitedDeletion is already true and date threshold not reached', async () => {
      const limitedBot = new Bot<GrammyContext>('mock-limited');

      const { chatSession: limitedChatSession, mockChatSessionMiddleware: limitedChatMiddleware } = mockChatSession({
        chatSettings: { disableDeleteMessage: false },
        isLimitedDeletion: true,
        // Recent date so compareDatesWithOffset returns false
        lastLimitedDeletionDate: new Date(),
      });

      const { mockSessionMiddleware: limitedSessionMiddleware } = mockSession({ isCurrentUserAdmin: false });

      const limitedOnTextListener = new OnTextListener(limitedBot, new Date(), mockMessageHandler as any);
      const { strategicComposer: limitedComposer } = getStrategicComposer({ onTextListener: limitedOnTextListener });

      limitedBot.use(i18n);
      limitedBot.use(selfDestructedReply());
      limitedBot.use(stateMiddleware);
      limitedBot.use(parseText);
      limitedBot.use(limitedSessionMiddleware);
      limitedBot.use(limitedChatMiddleware);
      limitedBot.use(limitedComposer);

      const limitedRequests = await prepareBotForTesting<GrammyContext>(limitedBot, {
        getChat: { invite_link: '' },
      });

      // Override to fail deleteMessage
      limitedBot.api.config.use((previous, method, payload, signal) => {
        if (method === 'deleteMessage') {
          return Promise.resolve({ ok: false, error_code: 400, description: 'Bad Request' } as any);
        }

        return previous(method, payload, signal);
      });

      limitedChatSession.isLimitedDeletion = true;
      limitedChatSession.lastLimitedDeletionDate = new Date(); // very recent

      const update = new MessageMockUpdate('spam message').build();

      await limitedBot.handleUpdate(update);

      const methods = limitedRequests.getMethods();

      // Should NOT call getChatAdministrators since we're still in the limited window
      expect(methods).not.toContain('getChatAdministrators');
    });

    it('should send cannot-delete notice when isLimitedDeletion is true but date threshold passed', async () => {
      const expiredBot = new Bot<GrammyContext>('mock-expired');

      const { chatSession: expiredChatSession, mockChatSessionMiddleware: expiredChatMiddleware } = mockChatSession({
        chatSettings: { disableDeleteMessage: false },
        isLimitedDeletion: true,
        lastLimitedDeletionDate: new Date(0), // epoch → threshold passed
      });

      const { mockSessionMiddleware: expiredSessionMiddleware } = mockSession({ isCurrentUserAdmin: false });

      const expiredOnTextListener = new OnTextListener(expiredBot, new Date(), mockMessageHandler as any);
      const { strategicComposer: expiredComposer } = getStrategicComposer({ onTextListener: expiredOnTextListener });

      expiredBot.use(i18n);
      expiredBot.use(selfDestructedReply());
      expiredBot.use(stateMiddleware);
      expiredBot.use(parseText);
      expiredBot.use(expiredSessionMiddleware);
      expiredBot.use(expiredChatMiddleware);
      expiredBot.use(expiredComposer);

      const expiredRequests = await prepareBotForTesting<GrammyContext>(expiredBot, {
        getChat: { invite_link: '' },
        getChatAdministrators: [],
      });

      expiredBot.api.config.use((previous, method, payload, signal) => {
        if (method === 'deleteMessage') {
          return Promise.resolve({ ok: false, error_code: 400, description: 'Bad Request' } as any);
        }

        return previous(method, payload, signal);
      });

      expiredChatSession.isLimitedDeletion = true;
      expiredChatSession.lastLimitedDeletionDate = new Date(0);

      const update = new MessageMockUpdate('spam message').build();

      await expiredBot.handleUpdate(update);

      const methods = expiredRequests.getMethods();

      expect(methods).toContain('getChatAdministrators');
    });
  });
});
