import type * as RedisClientModule from '@db/redis.client';

const { mockGet, mockSet, mockDel, mockKeys, mockMGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockDel: vi.fn(),
  mockKeys: vi.fn(),
  mockMGet: vi.fn(),
}));

vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    get: mockGet,
    set: mockSet,
    del: mockDel,
    keys: mockKeys,
    mGet: mockMGet,
    connect: vi.fn(),
    on: vi.fn(),
  })),
}));

vi.mock('@shared/config', () => ({
  environmentConfig: {
    REDIS_URL: 'redis://localhost:6379',
  },
}));

describe('redis.client', () => {
  let redisClient: typeof RedisClientModule;

  beforeAll(async () => {
    redisClient = await import('@db/redis.client');
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock - return empty array for mGet to avoid undefined.map errors
    mockMGet.mockResolvedValue([]);
  });

  describe('redisSelectors', () => {
    it('should export the expected selectors', () => {
      expect(redisClient.redisSelectors).toHaveProperty('isBotDeactivated');
      expect(redisClient.redisSelectors).toHaveProperty('userSessions');
      expect(redisClient.redisSelectors).toHaveProperty('chatSessions');
    });
  });

  describe('getRawValue', () => {
    describe('positive cases', () => {
      it('should return parsed JSON value', async () => {
        mockGet.mockResolvedValueOnce(JSON.stringify({ foo: 'bar' }));

        const result = await redisClient.getRawValue('somekey');

        expect(result).toEqual({ foo: 'bar' });
      });

      it('should return empty object for empty string', async () => {
        mockGet.mockResolvedValueOnce(null);

        const result = await redisClient.getRawValue('somekey');

        expect(result).toBeDefined();
      });
    });

    describe('negative cases', () => {
      it('should return empty object when key is null', async () => {
        const result = await redisClient.getRawValue(null);

        expect(result).toEqual({});
      });

      it('should return empty object when key is undefined', async () => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        const result = await redisClient.getRawValue(undefined);

        expect(result).toEqual({});
      });

      it('should return null when JSON parse fails', async () => {
        mockGet.mockResolvedValueOnce('invalid-json{');

        const result = await redisClient.getRawValue('bad-key');

        expect(result).toBeNull();
      });
    });
  });

  describe('getValue', () => {
    describe('positive cases', () => {
      it('should return parsed JSON object', async () => {
        mockGet.mockResolvedValueOnce(JSON.stringify({ name: 'test' }));

        const result = await redisClient.getValue('key');

        expect(result).toEqual({ name: 'test' });
      });

      it('should return empty object when key is empty', async () => {
        const result = await redisClient.getValue('');

        expect(result).toEqual({});
      });

      it('should return empty object on parse failure', async () => {
        mockGet.mockResolvedValueOnce('not-json');

        const result = await redisClient.getValue('key');

        expect(result).toEqual({});
      });
    });
  });

  describe('setRawValue', () => {
    describe('positive cases', () => {
      it('should stringify and store the value', async () => {
        mockSet.mockResolvedValueOnce('OK');

        await redisClient.setRawValue('key', { test: true } as any);

        expect(mockSet).toHaveBeenCalledWith('key', JSON.stringify({ test: true }));
      });
    });
  });

  describe('setValue', () => {
    describe('positive cases', () => {
      it('should call redis set with stringified value', async () => {
        mockSet.mockResolvedValueOnce('OK');

        await redisClient.setValue('key', { data: 1 });

        expect(mockSet).toHaveBeenCalledWith('key', JSON.stringify({ data: 1 }));
      });
    });

    describe('negative cases', () => {
      it('should return undefined when key is empty', () => {
        const result = redisClient.setValue('', { data: 1 });

        expect(result).toBeUndefined();
      });

      it('should return undefined when value is falsy', () => {
        const result = redisClient.setValue('key', null as any);

        expect(result).toBeUndefined();
      });
    });
  });

  describe('removeKey', () => {
    describe('positive cases', () => {
      it('should call del with the given key', async () => {
        mockDel.mockResolvedValueOnce(1);

        await redisClient.removeKey('key-to-delete');

        expect(mockDel).toHaveBeenCalledWith('key-to-delete');
      });
    });

    describe('negative cases', () => {
      it('should return null for empty key', () => {
        const result = redisClient.removeKey('');

        expect(result).toBeNull();
      });
    });
  });

  describe('getAllUserKeys', () => {
    describe('positive cases', () => {
      it('should return keys matching user session pattern', async () => {
        mockKeys.mockResolvedValueOnce(['123:123', '-100', '456:789']);

        const result = await redisClient.getAllUserKeys();

        expect(result).toEqual(['123:123', '456:789']);
      });

      it('should return empty array when no keys found', async () => {
        mockKeys.mockResolvedValueOnce([]);

        const result = await redisClient.getAllUserKeys();

        expect(result).toEqual([]);
      });
    });
  });

  describe('getAllUserRecords', () => {
    describe('positive cases', () => {
      it('should return parsed user sessions', async () => {
        mockKeys.mockResolvedValueOnce(['123:123']);
        mockMGet.mockResolvedValueOnce([JSON.stringify({ score: 5 })]);

        const result = await redisClient.getAllUserRecords();

        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('id', '123:123');
        expect(result[0]).toHaveProperty('payload', { score: 5 });
      });

      it('should filter out null values', async () => {
        mockKeys.mockResolvedValueOnce(['123:123', '456:456']);
        mockMGet.mockResolvedValueOnce([JSON.stringify({ score: 5 }), 'bad-json{']);

        const result = await redisClient.getAllUserRecords();

        expect(result).toHaveLength(1);
      });

      it('should return empty array when no user keys', async () => {
        mockKeys.mockResolvedValueOnce([]);

        const result = await redisClient.getAllUserRecords();

        expect(result).toEqual([]);
      });
    });
  });

  describe('getAllChatRecords', () => {
    describe('positive cases', () => {
      it('should return parsed chat sessions', async () => {
        mockKeys.mockResolvedValueOnce(['-100', '200']);
        mockMGet.mockResolvedValueOnce([JSON.stringify({ chatSettings: {} }), JSON.stringify({ chatSettings: {} })]);

        const result = await redisClient.getAllChatRecords();

        expect(result.length).toBeGreaterThan(0);
      });

      it('should return empty array when no keys found', async () => {
        mockKeys.mockResolvedValueOnce([]);

        const result = await redisClient.getAllChatRecords();

        expect(result).toEqual([]);
      });
    });
  });

  describe('getAllRecords', () => {
    describe('positive cases', () => {
      it('should return all records from Redis', async () => {
        mockKeys.mockResolvedValueOnce(['-100']);
        mockGet.mockResolvedValueOnce(JSON.stringify({ chatSettings: {} }));

        const result = await redisClient.getAllRecords();

        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('id', '-100');
      });

      it('should return empty array when no keys', async () => {
        mockKeys.mockResolvedValueOnce([]);

        const result = await redisClient.getAllRecords();

        expect(result).toEqual([]);
      });

      it('should filter null records', async () => {
        mockKeys.mockResolvedValueOnce(['-100', '-200']);
        mockGet.mockResolvedValueOnce(JSON.stringify({ chatSettings: {} }));
        mockGet.mockResolvedValueOnce(null);

        const result = await redisClient.getAllRecords();

        expect(result).toHaveLength(1);
      });
    });

    describe('negative cases', () => {
      it('should return empty array on error', async () => {
        mockKeys.mockRejectedValueOnce(new Error('Redis error'));

        const result = await redisClient.getAllRecords();

        expect(result).toEqual([]);
      });
    });
  });
});
