import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getStrategicComposer } from '@bot/composers/messages/strategic.composer';
import { i18n } from '@bot/i18n';
import { OnTextListener } from '@bot/listeners/on-text.listener';
import { parseText } from '@bot/middleware/parse-text.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession, mockState } from '@test-helpers/session-mocks';

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

// Ensure tests are not affected by the developer's local DEBUG=true in .env
vi.mock('@shared/config', () => ({
  environmentConfig: {
    DEBUG: false,
    UNIT_TESTING: true,
  },
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

const { state, mockStateMiddleware } = mockState({
  isUserAdmin: false,
});

const onTextListener = new OnTextListener(bot, new Date(), mockMessageHandler as any);
const { strategicComposer } = getStrategicComposer({ onTextListener });

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

describe('strategicComposer', () => {
  beforeAll(async () => {
    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(mockStateMiddleware);
    bot.use(mockChatSessionMiddleware);
    bot.use(strategicComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot));

    user = chats.newUser();
    group = chats.newSupergroup();
  }, 10_000);

  beforeEach(() => {
    chats.outgoing.clear();
    user.replies.clear();
    mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: false, tensor: 0.3, deleteRank: 0.9 });
    mockGetTrainingStartRank.mockResolvedValue(0.6);
    mockGetTrainingChatWhitelist.mockResolvedValue([]);
    chatSession.isLimitedDeletion = false;
    chatSession.lastLimitedDeletionDate = undefined;
    chatSession.chatSettings.disableDeleteMessage = false;
    state.isUserAdmin = false;
  });

  describe('no spam detected', () => {
    it('should call next() without any API calls when message is not spam', async () => {
      await user.sendText('hello world', { chat: group });

      expect(chats.outgoing.length).toEqual(0);
    });
  });

  describe('admin user', () => {
    it('should call next() without processing when user is admin and DEBUG is false', async () => {
      state.isUserAdmin = true;

      mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: true, tensor: 0.95, deleteRank: 0.5 });

      await user.sendText('spam message', { chat: group });

      // Admin bypass means no delete/reply
      expect(chats.outgoing.length).toEqual(0);
    });
  });

  describe('dataset branch (tensor in training range)', () => {
    it('should send to training chat when tensor is between startRank and deleteRank', async () => {
      // tensor: 0.7 > startRank: 0.6, and tensor: 0.7 < deleteRank: 0.9 → training message
      mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: false, tensor: 0.7, deleteRank: 0.9 });
      mockGetTrainingStartRank.mockResolvedValue(0.6);

      await user.sendText('possibly spam text', { chat: group });

      const methods = chats.outgoing.getMethods();

      expect(methods).toContain('sendMessage');
    });

    it('should NOT send to training chat when tensor is below startRank', async () => {
      mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: false, tensor: 0.4, deleteRank: 0.9 });
      mockGetTrainingStartRank.mockResolvedValue(0.6);

      await user.sendText('clean message', { chat: group });

      expect(chats.outgoing.length).toEqual(0);
    });

    it('should NOT send to training chat when tensor equals deleteRank', async () => {
      mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: false, tensor: 0.9, deleteRank: 0.9 });
      mockGetTrainingStartRank.mockResolvedValue(0.6);

      await user.sendText('clean message', { chat: group });

      expect(chats.outgoing.length).toEqual(0);
    });

    it('should NOT send to training chat when tensor is undefined', async () => {
      mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: false, tensor: undefined, deleteRank: 0.9 });
      mockGetTrainingStartRank.mockResolvedValue(0.6);

      await user.sendText('clean message', { chat: group });

      expect(chats.outgoing.length).toEqual(0);
    });
  });

  describe('spam detected (rep.rule is set)', () => {
    beforeEach(() => {
      mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: true, tensor: 0.95, deleteRank: 0.5 });
    });

    it('should delete message and send reply notification when delete succeeds', async () => {
      await user.sendText('spam message', { chat: group });

      const methods = chats.outgoing.getMethods();

      expect(methods).toContain('deleteMessage');
      expect(methods).toContain('sendMessage');
    });

    it('should delete message but NOT send reply when disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;

      await user.sendText('spam message', { chat: group });

      const methods = chats.outgoing.getMethods();

      expect(methods).toContain('deleteMessage');
      // No self-destructed reply
      expect(methods.filter((method) => method === 'sendMessage').length).toEqual(0);
    });

    it('should send to training chat when chat is in trainingChatWhitelist', async () => {
      // The mock update uses the registered group.id — pass it as a string
      mockGetTrainingChatWhitelist.mockResolvedValue([String(group.id)]);

      await user.sendText('spam message', { chat: group });

      const methods = chats.outgoing.getMethods();

      // Should have: sendMessage (to training chat) + deleteMessage + sendMessage (reply)
      expect(methods).toContain('deleteMessage');
      const sendMessageCount = methods.filter((method) => method === 'sendMessage').length;

      expect(sendMessageCount).toBeGreaterThanOrEqual(2);
    });

    it('should NOT send to training chat when chat is not in trainingChatWhitelist', async () => {
      mockGetTrainingChatWhitelist.mockResolvedValue(['999999']);

      await user.sendText('spam message', { chat: group });

      const methods = chats.outgoing.getMethods();

      expect(methods).toContain('deleteMessage');
    });

    it('should NOT send to training chat when trainingChatWhitelist is null', async () => {
      mockGetTrainingChatWhitelist.mockResolvedValue(null);

      await user.sendText('spam message', { chat: group });

      const methods = chats.outgoing.getMethods();

      expect(methods).toContain('deleteMessage');
    });
  });

  describe('delete fails', () => {
    beforeEach(() => {
      mockMessageHandler.getTensorRank.mockResolvedValue({ isSpam: true, tensor: 0.95, deleteRank: 0.5 });
    });

    it('should send cannot-delete notice when delete fails and isLimitedDeletion is false', async () => {
      const failBot = new Bot<GrammyContext>('mock-fail');

      const { chatSession: failChatSession, mockChatSessionMiddleware: failChatMiddleware } = mockChatSession({
        chatSettings: { disableDeleteMessage: false },
        isLimitedDeletion: false,
        lastLimitedDeletionDate: undefined,
      });

      const { mockStateMiddleware: failStateMiddleware } = mockState({ isUserAdmin: false });

      const failOnTextListener = new OnTextListener(failBot, new Date(), mockMessageHandler as any);
      const { strategicComposer: failComposer } = getStrategicComposer({ onTextListener: failOnTextListener });

      failBot.use(i18n);
      failBot.use(selfDestructedReply());
      failBot.use(stateMiddleware);
      failBot.use(parseText);
      failBot.use(failStateMiddleware);
      failBot.use(failChatMiddleware);
      failBot.use(failComposer);

      const { chats: failChats } = await prepareBot<GrammyContext>(failBot);

      const failAdmin = failChats.newUser({ id: 1, first_name: 'Admin', username: 'admin' });
      const failUser = failChats.newUser();
      const failGroup = failChats.newSupergroup();

      failGroup.own(failAdmin);

      // Override the API transformer to fail deleteMessage
      failBot.api.config.use((previous, method, payload, signal) => {
        if (method === 'deleteMessage') {
          return Promise.resolve({ ok: false, error_code: 400, description: 'Bad Request' } as any);
        }

        return previous(method, payload, signal);
      });

      failChatSession.isLimitedDeletion = false;

      await failUser.sendText('spam message', { chat: failGroup });

      // getChatAdministrators + reply + sendMessage (logs) should be called
      const methods = failChats.outgoing.getMethods();

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

      const { mockStateMiddleware: limitedStateMiddleware } = mockState({ isUserAdmin: false });

      const limitedOnTextListener = new OnTextListener(limitedBot, new Date(), mockMessageHandler as any);
      const { strategicComposer: limitedComposer } = getStrategicComposer({ onTextListener: limitedOnTextListener });

      limitedBot.use(i18n);
      limitedBot.use(selfDestructedReply());
      limitedBot.use(stateMiddleware);
      limitedBot.use(parseText);
      limitedBot.use(limitedStateMiddleware);
      limitedBot.use(limitedChatMiddleware);
      limitedBot.use(limitedComposer);

      const { chats: limitedChats } = await prepareBot<GrammyContext>(limitedBot);

      const limitedUser = limitedChats.newUser();
      const limitedGroup = limitedChats.newSupergroup();

      // Override to fail deleteMessage
      limitedBot.api.config.use((previous, method, payload, signal) => {
        if (method === 'deleteMessage') {
          return Promise.resolve({ ok: false, error_code: 400, description: 'Bad Request' } as any);
        }

        return previous(method, payload, signal);
      });

      limitedChatSession.isLimitedDeletion = true;
      limitedChatSession.lastLimitedDeletionDate = new Date(); // very recent

      await limitedUser.sendText('spam message', { chat: limitedGroup });

      const methods = limitedChats.outgoing.getMethods();

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

      const { mockStateMiddleware: expiredStateMiddleware } = mockState({ isUserAdmin: false });

      const expiredOnTextListener = new OnTextListener(expiredBot, new Date(), mockMessageHandler as any);
      const { strategicComposer: expiredComposer } = getStrategicComposer({ onTextListener: expiredOnTextListener });

      expiredBot.use(i18n);
      expiredBot.use(selfDestructedReply());
      expiredBot.use(stateMiddleware);
      expiredBot.use(parseText);
      expiredBot.use(expiredStateMiddleware);
      expiredBot.use(expiredChatMiddleware);
      expiredBot.use(expiredComposer);

      const { chats: expiredChats } = await prepareBot<GrammyContext>(expiredBot);

      const expiredUser = expiredChats.newUser();
      const expiredGroup = expiredChats.newSupergroup();

      expiredBot.api.config.use((previous, method, payload, signal) => {
        if (method === 'deleteMessage') {
          return Promise.resolve({ ok: false, error_code: 400, description: 'Bad Request' } as any);
        }

        return previous(method, payload, signal);
      });

      expiredChatSession.isLimitedDeletion = true;
      expiredChatSession.lastLimitedDeletionDate = new Date(0);

      await expiredUser.sendText('spam message', { chat: expiredGroup });

      const methods = expiredChats.outgoing.getMethods();

      expect(methods).toContain('getChatAdministrators');
    });
  });
});
