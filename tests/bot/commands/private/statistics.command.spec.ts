import type { Chats, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { StatisticsCommand } from '@bot/commands/private/statistics.command';
import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

const { mockGetChatSessions, mockAppendToSheet } = vi.hoisted(() => ({
  mockGetChatSessions: vi.fn(),
  mockAppendToSheet: vi.fn(),
}));

vi.mock('@services/redis.service', () => ({
  redisService: {
    getChatSessions: mockGetChatSessions,
  },
}));

vi.mock('@services/statistics-google.service', () => ({
  statisticsGoogleService: {
    appendToSheet: mockAppendToSheet,
  },
}));

vi.mock('@utils/optimize-write-context.util', () => ({
  optimizeWriteContextUtility: vi.fn(() => ({ update: {}, state: {} })),
}));

const mockChatSessions = [
  {
    payload: {
      chatType: 'supergroup',
      isBotAdmin: true,
      botRemoved: false,
      chatMembersCount: 100,
      chatSettings: {
        airRaidAlertSettings: {
          notificationMessage: true,
          state: 'Київська',
        },
        disableSwindlerMessage: false,
        disableDeleteAntisemitism: false,
        disableNsfwFilter: false,
        disableStrategicInfo: false,
        disableDeleteMessage: false,
        disableDeleteServiceMessage: false,
        enableDeleteCards: false,
        enableDeleteUrls: false,
        enableDeleteLocations: false,
        enableDeleteMentions: false,
        enableDeleteForwards: false,
        enableDeleteCounteroffensive: false,
        enableDeleteRussian: false,
        enableWarnRussian: false,
        enableDeleteObscene: false,
        enableDeleteDenylist: false,
        enableWarnObscene: false,
        enableAdminCheck: false,
        enableDeleteChannelMessages: false,
        disableChatWhileAirRaidAlert: false,
      },
    },
  },
  {
    payload: {
      chatType: 'group',
      isBotAdmin: false,
      botRemoved: true,
      chatMembersCount: 50,
      chatSettings: null,
    },
  },
  {
    payload: {
      chatType: 'private',
      isBotAdmin: false,
      botRemoved: false,
      chatMembersCount: 1,
      chatSettings: null,
    },
  },
];

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;

const bot = new Bot<GrammyContext>('mock');
const statsCommand = new StatisticsCommand();
const { mockChatSessionMiddleware } = mockChatSession({});

describe('StatisticsCommand', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(mockChatSessionMiddleware);

    bot.command('statistics', statsCommand.middleware());

    ({ chats } = await prepareBot<GrammyContext>(bot));
    user = chats.newUser();
  }, 5000);

  beforeEach(() => {
    chats.outgoing.clear();
    user.replies.clear();
    vi.clearAllMocks();
    mockGetChatSessions.mockResolvedValue(mockChatSessions);
    // eslint-disable-next-line unicorn/no-useless-undefined
    mockAppendToSheet.mockResolvedValue(undefined);
  });

  describe('middleware', () => {
    describe('positive cases', () => {
      it('should reply with statistics messages', async () => {
        await user.sendCommand('/statistics');

        const methods = chats.outgoing.getMethods();

        expect(methods).toContain('sendChatAction');
        expect(methods.filter((method) => method === 'sendMessage').length).toBeGreaterThanOrEqual(2);
      });

      it('should call appendToSheet with statistics data', async () => {
        await user.sendCommand('/statistics');

        expect(mockAppendToSheet).toHaveBeenCalledTimes(1);
        const callArguments = mockAppendToSheet.mock.calls[0][0];

        expect(Array.isArray(callArguments)).toBe(true);
        expect(callArguments.length).toBeGreaterThan(0);
      });

      it('should handle empty chat sessions', async () => {
        mockGetChatSessions.mockResolvedValue([]);

        await user.sendCommand('/statistics');

        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });
    });

    describe('negative cases', () => {
      it('should send error messages when getChatSessions fails', async () => {
        mockGetChatSessions.mockRejectedValueOnce(new Error('Redis error'));

        await user.sendCommand('/statistics');

        const methods = chats.outgoing.getMethods();

        expect(methods.filter((method) => method === 'sendMessage').length).toBeGreaterThan(0);
      });
    });
  });
});
