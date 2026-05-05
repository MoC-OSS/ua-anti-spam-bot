import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { featurePollComposer } from '@bot/composers/feature-poll.composer';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

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

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const bot = new Bot<GrammyContext>('mock');
const { mockChatSessionMiddleware } = mockChatSession({});

describe('featurePollComposer', () => {
  beforeAll(async () => {
    bot.use(mockChatSessionMiddleware);
    bot.use(featurePollComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot));

    user = chats.newUser();
    group = chats.newSupergroup();
  }, 15_000);

  beforeEach(() => {
    chats.clear();
    mockGetChatSessions.mockResolvedValue([]);
  });

  describe('/feature_poll command', () => {
    describe('when there are no qualifying sessions', () => {
      it('should always check access to support group', async () => {
        await user.sendCommand('/feature_poll', undefined, { chat: group });

        expect(chats.outgoing.getMethods()).toContain('getChat');
      });

      it('should reply "There are no sessions" when sessions list is empty', async () => {
        mockGetChatSessions.mockResolvedValue([]);
        await user.sendCommand('/feature_poll', undefined, { chat: group });

        const replyTexts = chats.outgoing.getAll<'sendMessage'>().map((request) => request?.payload?.text as string | undefined);

        expect(replyTexts.some((textValue) => textValue?.includes('There are no sessions'))).toBe(true);
      });

      it('should reply "There are no sessions" when all sessions are non-supergroups', async () => {
        mockGetChatSessions.mockResolvedValue([
          { id: '-1001', payload: { chatType: 'group', botRemoved: false, chatMembersCount: 100 } },
          { id: '-1002', payload: { chatType: 'channel', botRemoved: false, chatMembersCount: 200 } },
        ]);

        await user.sendCommand('/feature_poll', undefined, { chat: group });

        const replyTexts = chats.outgoing.getAll<'sendMessage'>().map((request) => request?.payload?.text as string | undefined);

        expect(replyTexts.some((textValue) => textValue?.includes('There are no sessions'))).toBe(true);
      });

      it('should reply "There are no sessions" when fewer than 11 qualifying sessions (slice is empty)', async () => {
        mockGetChatSessions.mockResolvedValue(
          Array.from({ length: 5 }, (_, index) => createSuperGroupSession(-(1_001_000_000 + index), 100 + index)),
        );

        await user.sendCommand('/feature_poll', undefined, { chat: group });

        const replyTexts = chats.outgoing.getAll<'sendMessage'>().map((request) => request?.payload?.text as string | undefined);

        expect(replyTexts.some((textValue) => textValue?.includes('There are no sessions'))).toBe(true);
      });

      it('should filter out botRemoved sessions', async () => {
        mockGetChatSessions.mockResolvedValue([
          { id: '-1001', payload: { chatType: 'supergroup', botRemoved: true, chatMembersCount: 100 } },
        ]);

        await user.sendCommand('/feature_poll', undefined, { chat: group });

        const replyTexts = chats.outgoing.getAll<'sendMessage'>().map((request) => request?.payload?.text as string | undefined);

        expect(replyTexts.some((textValue) => textValue?.includes('There are no sessions'))).toBe(true);
      });
    });

    describe('when there are qualifying sessions (more than 10)', () => {
      it('should reply "Started feature poll" and eventually "Ended feature poll"', async () => {
        const sessions = Array.from({ length: 15 }, (_, index) => createSuperGroupSession(-(1_001_000_000 + index), 100 + index));

        mockGetChatSessions.mockResolvedValue(sessions);

        vi.useFakeTimers();
        const promise = user.sendCommand('/feature_poll', undefined, { chat: group });

        await vi.runAllTimersAsync();
        await promise;
        vi.useRealTimers();

        const replyTexts = chats.outgoing.getAll<'sendMessage'>().map((request) => request?.payload?.text as string | undefined);

        expect(replyTexts.some((textValue) => textValue?.includes('Started feature poll'))).toBe(true);
        expect(replyTexts.some((textValue) => textValue?.includes('Ended feature poll'))).toBe(true);
      });
    });
  });
});
