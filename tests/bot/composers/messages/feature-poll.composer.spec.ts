import { Bot } from 'grammy';

import { featurePollComposer } from '@bot/composers/feature-poll.composer';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import { prepareBotForTesting } from '@testing/prepare';
import { mockChatSession } from '@testing/testing-main';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';

const { mockGetChatSessions } = vi.hoisted(() => ({
  mockGetChatSessions: vi.fn().mockResolvedValue([]),
}));

vi.mock('@services/redis.service', () => ({
  redisService: {
    getChatSessions: mockGetChatSessions,
  },
}));

vi.mock('@message', () => ({
  getSuccessfulMessage: vi.fn().mockReturnValue('Successful!'),
  getUpdateMessage: vi.fn().mockReturnValue('Update!'),
}));

vi.mock('@utils/error-handler.util', () => ({
  handleError: vi.fn(),
}));

vi.mock('@utils/logger.util', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

const commandText = '/feature_poll';

/**
 *
 */
function getFeaturePollUpdate() {
  return new MessageMockUpdate(commandText).buildOverwrite({
    message: {
      entities: [{ offset: 0, length: commandText.length, type: 'bot_command' }],
    },
  });
}

/**
 *
 * @param id
 * @param membersCount
 */
function createSuperGroupSession(id: number, membersCount: number) {
  return {
    id: String(id),
    payload: {
      chatType: 'supergroup' as const,
      botRemoved: false,
      chatMembersCount: membersCount,
    },
  };
}

let outgoingRequests: OutgoingRequests;
const bot = new Bot<GrammyContext>('mock');
const { mockChatSessionMiddleware } = mockChatSession({});

describe('featurePollComposer', () => {
  beforeAll(async () => {
    bot.use(mockChatSessionMiddleware);
    bot.use(featurePollComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: {} as any,
    });
  }, 15_000);

  beforeEach(() => {
    outgoingRequests.clear();
    mockGetChatSessions.mockResolvedValue([]);
  });

  describe('/feature_poll command', () => {
    describe('when there are no qualifying sessions', () => {
      it('should always check access to support group', async () => {
        await bot.handleUpdate(getFeaturePollUpdate());

        expect(outgoingRequests.getMethods()).toContain('getChat');
      });

      it('should reply "There are no sessions" when sessions list is empty', async () => {
        mockGetChatSessions.mockResolvedValue([]);
        await bot.handleUpdate(getFeaturePollUpdate());

        const replyTexts = outgoingRequests.getAll<'sendMessage'>().map((request) => request?.payload?.text as string | undefined);

        expect(replyTexts.some((textValue) => textValue?.includes('There are no sessions'))).toBe(true);
      });

      it('should reply "There are no sessions" when all sessions are non-supergroups', async () => {
        mockGetChatSessions.mockResolvedValue([
          { id: '-1001', payload: { chatType: 'group', botRemoved: false, chatMembersCount: 100 } },
          { id: '-1002', payload: { chatType: 'channel', botRemoved: false, chatMembersCount: 200 } },
        ]);

        await bot.handleUpdate(getFeaturePollUpdate());

        const replyTexts = outgoingRequests.getAll<'sendMessage'>().map((request) => request?.payload?.text as string | undefined);

        expect(replyTexts.some((textValue) => textValue?.includes('There are no sessions'))).toBe(true);
      });

      it('should reply "There are no sessions" when fewer than 11 qualifying sessions (slice is empty)', async () => {
        // 5 qualifying sessions → after slice(10,60) → empty
        mockGetChatSessions.mockResolvedValue(
          Array.from({ length: 5 }, (_, index) => createSuperGroupSession(-(1_001_000_000 + index), 100 + index)),
        );

        await bot.handleUpdate(getFeaturePollUpdate());

        const replyTexts = outgoingRequests.getAll<'sendMessage'>().map((request) => request?.payload?.text as string | undefined);

        expect(replyTexts.some((textValue) => textValue?.includes('There are no sessions'))).toBe(true);
      });

      it('should filter out botRemoved sessions', async () => {
        mockGetChatSessions.mockResolvedValue([
          { id: '-1001', payload: { chatType: 'supergroup', botRemoved: true, chatMembersCount: 100 } },
        ]);

        await bot.handleUpdate(getFeaturePollUpdate());

        const replyTexts = outgoingRequests.getAll<'sendMessage'>().map((request) => request?.payload?.text as string | undefined);

        expect(replyTexts.some((textValue) => textValue?.includes('There are no sessions'))).toBe(true);
      });
    });

    describe('when there are qualifying sessions (more than 10)', () => {
      it('should reply "Started feature poll" and eventually "Ended feature poll"', async () => {
        // 15 supergroup sessions → slice(10,60) gives 5 sessions
        const sessions = Array.from({ length: 15 }, (_, index) => createSuperGroupSession(-(1_001_000_000 + index), 100 + index));

        mockGetChatSessions.mockResolvedValue(sessions);

        vi.useFakeTimers();
        const promise = bot.handleUpdate(getFeaturePollUpdate());

        await vi.runAllTimersAsync();
        await promise;
        vi.useRealTimers();

        const replyTexts = outgoingRequests.getAll<'sendMessage'>().map((request) => request?.payload?.text as string | undefined);

        expect(replyTexts.some((textValue) => textValue?.includes('Started feature poll'))).toBe(true);
        expect(replyTexts.some((textValue) => textValue?.includes('Ended feature poll'))).toBe(true);
      });
    });
  });
});
