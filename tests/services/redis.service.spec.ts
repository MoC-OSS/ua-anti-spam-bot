import { RedisService } from '@services/redis.service';

const { mockGet, mockSet, mockDel, mockKeys, mockMGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockDel: vi.fn(),
  mockKeys: vi.fn(),
  mockMGet: vi.fn(),
}));

vi.mock('@db/redis.client', () => ({
  redisSelectors: {
    isBotDeactivated: 'isBotDeactivated',
    botTensorPercent: 'botTensorPercent',
    swindlersStatistic: 'swindlersStatistic',
    positives: 'training:positives',
    negatives: 'training:negatives',
    trainingChatWhitelist: 'training:chatWhiteList',
    trainingStartRank: 'training:startRank',
    trainingTempMessages: 'training:tempMessages',
    trainingBots: 'training:bots',
    userSessions: /^-?\d+:-?\d+$/,
    chatSessions: /^-?\d+$/,
  },
  client: {
    get: mockGet,
    set: mockSet,
    del: mockDel,
    keys: mockKeys,
    mGet: mockMGet,
  },
  getRawValue: vi.fn(async (key: string) => {
    if (!key) {
      return {};
    }

    const value = await mockGet(key);

    return value ? JSON.parse(value) : null;
  }),
  setRawValue: vi.fn(async (key: string, value: unknown) => mockSet(key, JSON.stringify(value))),
  removeKey: vi.fn(async (key: string) => mockDel(key)),
  getValue: vi.fn(async (key: string) => {
    const value = await mockGet(key);

    return value ? JSON.parse(value) : {};
  }),
  getAllUserRecords: vi.fn(async () => []),
  getAllChatRecords: vi.fn(async () => []),
}));

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RedisService();
  });

  describe('getTrainingChatWhitelist', () => {
    describe('positive cases', () => {
      it('should return the whitelist array when value exists', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(['chat1', 'chat2'] as any);

        const result = await service.getTrainingChatWhitelist();

        expect(result).toEqual(['chat1', 'chat2']);
      });

      it('should return empty array when value is null', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(null);

        const result = await service.getTrainingChatWhitelist();

        expect(result).toEqual([]);
      });
    });
  });

  describe('setTrainingChatWhitelist', () => {
    describe('positive cases', () => {
      it('should call setRawValue with parsed chat IDs', async () => {
        const { setRawValue } = await import('@db/redis.client');

        await service.setTrainingChatWhitelist('-100123, -100456');

        expect(setRawValue).toHaveBeenCalledWith('training:chatWhiteList', ['-100123', '-100456']);
      });
    });
  });

  describe('updateTrainingChatWhitelist', () => {
    describe('positive cases', () => {
      it('should append a new chat ID to the whitelist', async () => {
        const { getRawValue, setRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(['existing'] as any);

        await service.updateTrainingChatWhitelist('newchat');

        expect(setRawValue).toHaveBeenCalledWith('training:chatWhiteList', ['existing', 'newchat']);
      });
    });
  });

  describe('getTrainingBots', () => {
    describe('positive cases', () => {
      it('should return bots array', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(['@bot1', '@bot2'] as any);

        const result = await service.getTrainingBots();

        expect(result).toEqual(['@bot1', '@bot2']);
      });

      it('should return empty array when null', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(null);

        const result = await service.getTrainingBots();

        expect(result).toEqual([]);
      });
    });
  });

  describe('setTrainingBots', () => {
    describe('positive cases', () => {
      it('should call setRawValue with the bots array', async () => {
        const { setRawValue } = await import('@db/redis.client');

        await service.setTrainingBots(['@bot1']);

        expect(setRawValue).toHaveBeenCalledWith('training:bots', ['@bot1']);
      });
    });
  });

  describe('updateTrainingBots', () => {
    describe('positive cases', () => {
      it('should merge bots without duplicates', async () => {
        const { getRawValue, setRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(['@existing'] as any);

        await service.updateTrainingBots(['@existing', '@new']);

        expect(setRawValue).toHaveBeenCalledWith('training:bots', ['@existing', '@new']);
      });
    });
  });

  describe('getTrainingStartRank', () => {
    describe('positive cases', () => {
      it('should call getRawValue with the correct key', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(5 as any);

        const result = await service.getTrainingStartRank();

        expect(getRawValue).toHaveBeenCalledWith('training:startRank');
        expect(result).toBe(5);
      });
    });
  });

  describe('setTrainingStartRank', () => {
    describe('positive cases', () => {
      it('should store a valid number', async () => {
        const { setRawValue } = await import('@db/redis.client');

        await service.setTrainingStartRank(10);

        expect(setRawValue).toHaveBeenCalledWith('training:startRank', 10);
      });
    });

    describe('negative cases', () => {
      it('should return undefined for invalid value', () => {
        const result = service.setTrainingStartRank(0);

        expect(result).toBeUndefined();
      });
    });
  });

  describe('getBotTensorPercent', () => {
    describe('positive cases', () => {
      it('should call getRawValue with correct key', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(80 as any);

        const result = await service.getBotTensorPercent();

        expect(getRawValue).toHaveBeenCalledWith('botTensorPercent');
        expect(result).toBe(80);
      });
    });
  });

  describe('setBotTensorPercent', () => {
    describe('positive cases', () => {
      it('should store a valid percent', async () => {
        const { setRawValue } = await import('@db/redis.client');

        await service.setBotTensorPercent(75);

        expect(setRawValue).toHaveBeenCalledWith('botTensorPercent', 75);
      });
    });

    describe('negative cases', () => {
      it('should return undefined for zero', () => {
        const result = service.setBotTensorPercent(0);

        expect(result).toBeUndefined();
      });
    });
  });

  describe('getIsBotDeactivated', () => {
    describe('positive cases', () => {
      it('should call getRawValue with correct key', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(true as any);

        const isDeactivated = await service.getIsBotDeactivated();

        expect(getRawValue).toHaveBeenCalledWith('isBotDeactivated');
        expect(isDeactivated).toBe(true);
      });
    });
  });

  describe('setIsBotDeactivated', () => {
    describe('positive cases', () => {
      it('should call setRawValue', async () => {
        const { setRawValue } = await import('@db/redis.client');

        await service.setIsBotDeactivated(true);

        expect(setRawValue).toHaveBeenCalledWith('isBotDeactivated', true);
      });
    });
  });

  describe('getNegatives', () => {
    describe('positive cases', () => {
      it('should return words array', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(['word1'] as any);

        const result = await service.getNegatives();

        expect(result).toEqual(['word1']);
      });

      it('should return empty array when null', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(null);

        const result = await service.getNegatives();

        expect(result).toEqual([]);
      });
    });
  });

  describe('getPositives', () => {
    describe('positive cases', () => {
      it('should return words array', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(['positive1'] as any);

        const result = await service.getPositives();

        expect(result).toEqual(['positive1']);
      });
    });
  });

  describe('updateNegatives', () => {
    describe('positive cases', () => {
      it('should append word to existing negatives', async () => {
        const { getRawValue, setRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(['existing'] as any);

        await service.updateNegatives('newword');

        expect(setRawValue).toHaveBeenCalledWith('training:negatives', ['existing', 'newword']);
      });
    });
  });

  describe('updatePositives', () => {
    describe('positive cases', () => {
      it('should append word to existing positives', async () => {
        const { getRawValue, setRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(['existing'] as any);

        await service.updatePositives('newword');

        expect(setRawValue).toHaveBeenCalledWith('training:positives', ['existing', 'newword']);
      });
    });
  });

  describe('deleteNegatives', () => {
    describe('positive cases', () => {
      it('should call removeKey with the negatives selector', async () => {
        const { removeKey } = await import('@db/redis.client');

        await service.deleteNegatives();

        expect(removeKey).toHaveBeenCalledWith('training:negatives');
      });
    });
  });

  describe('deletePositives', () => {
    describe('positive cases', () => {
      it('should call removeKey with the positives selector', async () => {
        const { removeKey } = await import('@db/redis.client');

        await service.deletePositives();

        expect(removeKey).toHaveBeenCalledWith('training:positives');
      });
    });
  });

  describe('updateChatSession', () => {
    describe('positive cases', () => {
      it('should merge and store updated session data', async () => {
        const { getRawValue, setRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce({ chatSettings: {}, isBotAdmin: false } as any);

        await service.updateChatSession('-100', { isBotAdmin: true } as any);

        expect(setRawValue).toHaveBeenCalledWith('-100', expect.objectContaining({ isBotAdmin: true }));
      });
    });

    describe('negative cases', () => {
      it('should throw for an invalid chat ID', async () => {
        await expect(service.updateChatSession('invalid-id', {} as any)).rejects.toThrow('This is an invalid chat id');
      });
    });
  });

  describe('updateChatSettings', () => {
    describe('positive cases', () => {
      it('should update chatSettings in the session', async () => {
        const { getRawValue, setRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce({ isBotAdmin: false } as any);

        await service.updateChatSettings('-100', { enableDeleteUrls: true } as any);

        expect(setRawValue).toHaveBeenCalledWith('-100', expect.objectContaining({ chatSettings: { enableDeleteUrls: true } }));
      });
    });

    describe('negative cases', () => {
      it('should throw for an invalid chat ID', async () => {
        await expect(service.updateChatSettings('not-a-chat', {} as any)).rejects.toThrow('This is an invalid chat id');
      });
    });
  });

  describe('getUserSessions', () => {
    describe('positive cases', () => {
      it('should delegate to getAllUserRecords', async () => {
        const { getAllUserRecords } = await import('@db/redis.client');

        vi.mocked(getAllUserRecords).mockResolvedValueOnce([{ id: '1:1', payload: {} }] as any);

        const result = await service.getUserSessions();

        expect(getAllUserRecords).toHaveBeenCalled();
        expect(result).toHaveLength(1);
      });
    });
  });

  describe('getUserSession', () => {
    describe('positive cases', () => {
      it('should call getRawValue with user key pattern', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce({ score: 0 } as any);

        await service.getUserSession('123');

        expect(getRawValue).toHaveBeenCalledWith('123:123');
      });
    });
  });

  describe('setUserSession', () => {
    describe('positive cases', () => {
      it('should call setRawValue with user key pattern', async () => {
        const { setRawValue } = await import('@db/redis.client');

        await service.setUserSession('123', { score: 5 } as any);

        expect(setRawValue).toHaveBeenCalledWith('123:123', { score: 5 });
      });
    });
  });

  describe('getChatSessions', () => {
    describe('positive cases', () => {
      it('should delegate to getAllChatRecords', async () => {
        const { getAllChatRecords } = await import('@db/redis.client');

        vi.mocked(getAllChatRecords).mockResolvedValueOnce([{ id: '-100', payload: {} }] as any);

        const result = await service.getChatSessions();

        expect(getAllChatRecords).toHaveBeenCalled();
        expect(result).toHaveLength(1);
      });
    });
  });

  describe('getChatSession', () => {
    describe('positive cases', () => {
      it('should return session data for a valid chat ID', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce({ chatSettings: {} } as any);

        const result = await service.getChatSession('-100');

        expect(getRawValue).toHaveBeenCalledWith('-100');
        expect(result).toEqual({ chatSettings: {} });
      });
    });

    describe('negative cases', () => {
      it('should throw for an invalid chat ID', async () => {
        await expect(service.getChatSession('abc')).rejects.toThrow('This is an invalid chat id');
      });
    });
  });

  describe('getTrainingTempMessages', () => {
    describe('positive cases', () => {
      it('should return messages array', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(['msg1'] as any);

        const result = await service.getTrainingTempMessages();

        expect(result).toEqual(['msg1']);
      });

      it('should return empty array when null', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(null);

        const result = await service.getTrainingTempMessages();

        expect(result).toEqual([]);
      });
    });
  });

  describe('setTrainingTempMessages', () => {
    describe('positive cases', () => {
      it('should store messages', async () => {
        const { setRawValue } = await import('@db/redis.client');

        await service.setTrainingTempMessages(['msg1', 'msg2']);

        expect(setRawValue).toHaveBeenCalledWith('training:tempMessages', ['msg1', 'msg2']);
      });
    });
  });

  describe('setSwindlersStatistic', () => {
    describe('positive cases', () => {
      it('should store statistic', async () => {
        const { setRawValue } = await import('@db/redis.client');

        await service.setSwindlersStatistic({ url1: ['msg1'] });

        expect(setRawValue).toHaveBeenCalledWith('swindlersStatistic', { url1: ['msg1'] });
      });
    });
  });

  describe('getSwindlersStatistic', () => {
    describe('positive cases', () => {
      it('should return statistic object', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce({ url1: ['msg1'] } as any);

        const result = await service.getSwindlersStatistic();

        expect(result).toEqual({ url1: ['msg1'] });
      });

      it('should return empty object when null', async () => {
        const { getRawValue } = await import('@db/redis.client');

        vi.mocked(getRawValue).mockResolvedValueOnce(null);

        const result = await service.getSwindlersStatistic();

        expect(result).toEqual({});
      });
    });
  });
});
