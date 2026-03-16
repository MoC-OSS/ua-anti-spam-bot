import { Bot } from 'grammy';

import { RankCommand } from '@bot/commands/private/rank.command';
import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { stateMiddleware } from '@bot/middleware/state.middleware';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import { prepareBotForTesting } from '@testing/prepare';
import { MessagePrivateMockUpdate } from '@testing/updates/message-private-mock.update';

import type { GrammyContext } from '@app-types/context';

const {
  mockGetBotTensorPercent,
  mockSetBotTensorPercent,
  mockGetTrainingStartRank,
  mockSetTrainingStartRank,
  mockGetChatWhitelist,
  mockSetChatWhitelist,
  mockUpdateChatWhitelist,
} = vi.hoisted(() => ({
  mockGetBotTensorPercent: vi.fn(),
  mockSetBotTensorPercent: vi.fn(),
  mockGetTrainingStartRank: vi.fn(),
  mockSetTrainingStartRank: vi.fn(),
  mockGetChatWhitelist: vi.fn(),
  mockSetChatWhitelist: vi.fn(),
  mockUpdateChatWhitelist: vi.fn(),
}));

vi.mock('@services/redis.service', () => ({
  redisService: {
    getBotTensorPercent: mockGetBotTensorPercent,
    setBotTensorPercent: mockSetBotTensorPercent,
    getTrainingStartRank: mockGetTrainingStartRank,
    setTrainingStartRank: mockSetTrainingStartRank,
    getTrainingChatWhitelist: mockGetChatWhitelist,
    setTrainingChatWhitelist: mockSetChatWhitelist,
    updateTrainingChatWhitelist: mockUpdateChatWhitelist,
  },
}));

const mockTensorService = { setSpamThreshold: vi.fn() } as any;

let outgoingRequests: OutgoingRequests;
const bot = new Bot<GrammyContext>('mock');
const rankCommand = new RankCommand(mockTensorService);

/**
 *
 * @param command
 * @param match
 */
function buildCommandUpdate(command: string, match = '') {
  const full = match ? `${command} ${match}` : command;

  return new MessagePrivateMockUpdate(full).buildOverwrite({
    message: {
      entities: [{ offset: 0, length: command.length, type: 'bot_command' }],
    },
  });
}

describe('RankCommand', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);

    bot.command('set_rank', rankCommand.setRankMiddleware());
    bot.command('set_training_start_rank', rankCommand.setTrainingStartRank());
    bot.command('set_training_chat_whitelist', rankCommand.setTrainingChatWhitelist());
    bot.command('update_training_chat_whitelist', rankCommand.updateTrainingChatWhitelist());

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot);
  }, 5000);

  beforeEach(() => {
    outgoingRequests.clear();
    vi.clearAllMocks();
    mockGetBotTensorPercent.mockResolvedValue(50);
    mockGetTrainingStartRank.mockResolvedValue(30);
    mockGetChatWhitelist.mockResolvedValue(['-100123', '-100456']);
  });

  describe('setRankMiddleware', () => {
    describe('positive cases', () => {
      it('should reply with current rank when no match provided', async () => {
        await bot.handleUpdate(buildCommandUpdate('/set_rank'));

        expect(mockGetBotTensorPercent).toHaveBeenCalled();
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
        expect(outgoingRequests.getAll<'sendMessage'>()[0]?.payload.text).toContain('50');
      });

      it('should set new rank when valid number is provided', async () => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        mockSetBotTensorPercent.mockResolvedValue(undefined);
        await bot.handleUpdate(buildCommandUpdate('/set_rank', '75'));

        expect(mockTensorService.setSpamThreshold).toHaveBeenCalledWith(75);
        expect(mockSetBotTensorPercent).toHaveBeenCalledWith(75);
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });
    });

    describe('negative cases', () => {
      it('should reply with error when non-numeric match provided', async () => {
        await bot.handleUpdate(buildCommandUpdate('/set_rank', 'abc'));

        expect(outgoingRequests.getAll<'sendMessage'>()[0]?.payload.text).toContain('Cannot parse');
      });
    });
  });

  describe('setTrainingStartRank', () => {
    describe('positive cases', () => {
      it('should reply with current training start rank when no match provided', async () => {
        await bot.handleUpdate(buildCommandUpdate('/set_training_start_rank'));

        expect(mockGetTrainingStartRank).toHaveBeenCalled();
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
        expect(outgoingRequests.getAll<'sendMessage'>()[0]?.payload.text).toContain('30');
      });

      it('should set new training start rank when valid number provided', async () => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        mockSetTrainingStartRank.mockResolvedValue(undefined);
        await bot.handleUpdate(buildCommandUpdate('/set_training_start_rank', '40'));

        expect(mockSetTrainingStartRank).toHaveBeenCalledWith(40);
      });
    });

    describe('negative cases', () => {
      it('should reply with error when non-numeric match provided', async () => {
        await bot.handleUpdate(buildCommandUpdate('/set_training_start_rank', 'not-a-number'));

        expect(outgoingRequests.getAll<'sendMessage'>()[0]?.payload.text).toContain('Cannot parse');
      });
    });
  });

  describe('setTrainingChatWhitelist', () => {
    describe('positive cases', () => {
      it('should reply with current whitelist when no match provided', async () => {
        await bot.handleUpdate(buildCommandUpdate('/set_training_chat_whitelist'));

        expect(mockGetChatWhitelist).toHaveBeenCalled();
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });

      it('should set new whitelist when match provided', async () => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        mockSetChatWhitelist.mockResolvedValue(undefined);
        await bot.handleUpdate(buildCommandUpdate('/set_training_chat_whitelist', '-100123,-100456'));

        expect(mockSetChatWhitelist).toHaveBeenCalledWith('-100123,-100456');
      });
    });
  });

  describe('updateTrainingChatWhitelist', () => {
    describe('positive cases', () => {
      it('should reply with current whitelist when no match provided', async () => {
        await bot.handleUpdate(buildCommandUpdate('/update_training_chat_whitelist'));

        expect(mockGetChatWhitelist).toHaveBeenCalled();
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });

      it('should update whitelist when match provided', async () => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        mockUpdateChatWhitelist.mockResolvedValue(undefined);
        await bot.handleUpdate(buildCommandUpdate('/update_training_chat_whitelist', '-100999'));

        expect(mockUpdateChatWhitelist).toHaveBeenCalledWith('-100999');
      });
    });
  });
});
