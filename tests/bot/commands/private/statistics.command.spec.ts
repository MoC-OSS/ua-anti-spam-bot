import { Bot } from 'grammy';

import { StatisticsCommand } from '@bot/commands/private/statistics.command';
import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import { prepareBotForTesting } from '@testing/prepare';
import { mockChatSession } from '@testing/testing-main';
import { MessagePrivateMockUpdate } from '@testing/updates/message-private-mock.update';

import type { GrammyContext } from '@app-types/context';

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

let outgoingRequests: OutgoingRequests;
const bot = new Bot<GrammyContext>('mock');
const statsCommand = new StatisticsCommand();
const { mockChatSessionMiddleware } = mockChatSession({});

/**
 *
 */
function getStatisticsCommandUpdate() {
  return new MessagePrivateMockUpdate('/statistics').buildOverwrite({
    message: {
      entities: [{ offset: 0, length: '/statistics'.length, type: 'bot_command' }],
    },
  });
}

describe('StatisticsCommand', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(mockChatSessionMiddleware);

    bot.command('statistics', statsCommand.middleware());

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot);
  }, 5000);

  beforeEach(() => {
    outgoingRequests.clear();
    vi.clearAllMocks();
    mockGetChatSessions.mockResolvedValue(mockChatSessions);
    // eslint-disable-next-line unicorn/no-useless-undefined
    mockAppendToSheet.mockResolvedValue(undefined);
  });

  describe('middleware', () => {
    describe('positive cases', () => {
      it('should reply with statistics messages', async () => {
        await bot.handleUpdate(getStatisticsCommandUpdate());

        const methods = outgoingRequests.getMethods();

        expect(methods).toContain('sendChatAction');
        expect(methods.filter((method) => method === 'sendMessage').length).toBeGreaterThanOrEqual(2);
      });

      it('should call appendToSheet with statistics data', async () => {
        await bot.handleUpdate(getStatisticsCommandUpdate());

        expect(mockAppendToSheet).toHaveBeenCalledTimes(1);
        const callArguments = mockAppendToSheet.mock.calls[0][0];

        expect(Array.isArray(callArguments)).toBe(true);
        expect(callArguments.length).toBeGreaterThan(0);
      });

      it('should handle empty chat sessions', async () => {
        mockGetChatSessions.mockResolvedValue([]);

        await bot.handleUpdate(getStatisticsCommandUpdate());

        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });
    });

    describe('negative cases', () => {
      it('should send error messages when getChatSessions fails', async () => {
        mockGetChatSessions.mockRejectedValueOnce(new Error('Redis error'));

        await bot.handleUpdate(getStatisticsCommandUpdate());

        const methods = outgoingRequests.getMethods();

        // Even on error, should try to send error info
        expect(methods.filter((method) => method === 'sendMessage').length).toBeGreaterThan(0);
      });
    });
  });
});
