import type { NextFunction } from 'grammy';

import { RedisMiddleware } from '@bot/middleware/redis.middleware';

import type { GrammyContext } from '@app-types/context';
import type { RedisSessionOptions } from '@app-types/session';

const { mockGetValue, mockSetValue } = vi.hoisted(() => ({
  mockGetValue: vi.fn().mockResolvedValue({}),
  // eslint-disable-next-line unicorn/no-useless-undefined
  mockSetValue: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@db/redis.client', () => ({
  getValue: mockGetValue,
  setValue: mockSetValue,
}));

const makeOptions = (overrides: Partial<RedisSessionOptions> = {}): RedisSessionOptions => ({
  property: 'chatSession',
  state: {},
  format: {},
  getSessionKey: vi.fn().mockReturnValue('chat:123'),
  ...overrides,
});

describe('RedisMiddleware', () => {
  beforeEach(() => {
    mockGetValue.mockClear();
    mockSetValue.mockClear();
  });

  describe('getSessionKey', () => {
    it('should delegate to options.getSessionKey', () => {
      const getSessionKey = vi.fn().mockReturnValue('custom:key');
      const options = makeOptions({ getSessionKey });
      const instance = new RedisMiddleware(options);
      const context = {} as GrammyContext;

      const result = instance.getSessionKey(context);

      expect(getSessionKey).toHaveBeenCalledWith(context);
      expect(result).toBe('custom:key');
    });
  });

  describe('getSession', () => {
    it('should call redisClient.getValue with the given key', async () => {
      const sessionData = { foo: 'bar' };

      mockGetValue.mockResolvedValueOnce(sessionData);
      const instance = new RedisMiddleware(makeOptions());

      const result = await instance.getSession('chat:123');

      expect(mockGetValue).toHaveBeenCalledWith('chat:123');
      expect(result).toEqual(sessionData);
    });
  });

  describe('saveSession', () => {
    it('should call redisClient.setValue with key and payload', async () => {
      const instance = new RedisMiddleware(makeOptions());
      const payload = { data: 'value' };

      await instance.saveSession('chat:123', payload);

      expect(mockSetValue).toHaveBeenCalledWith('chat:123', payload);
    });
  });

  describe('middleware()', () => {
    it('should call next without loading/saving session when key is empty string', async () => {
      const options = makeOptions({ getSessionKey: vi.fn().mockReturnValue('') });
      const instance = new RedisMiddleware(options);
      const mw = instance.middleware();
      const context: any = {};
      // eslint-disable-next-line unicorn/no-useless-undefined
      const next = vi.fn().mockResolvedValue(undefined);

      await mw(context, next as unknown as NextFunction);

      expect(next).toHaveBeenCalledOnce();
      expect(mockGetValue).not.toHaveBeenCalled();
      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it('should load session, call next, and save session when key is valid', async () => {
      const sessionData = { loaded: true };

      mockGetValue.mockResolvedValueOnce(sessionData);
      const instance = new RedisMiddleware(makeOptions());
      const mw = instance.middleware();
      const context: any = {};
      // eslint-disable-next-line unicorn/no-useless-undefined
      const next = vi.fn().mockResolvedValue(undefined);

      await mw(context, next as unknown as NextFunction);

      expect(mockGetValue).toHaveBeenCalledWith('chat:123');
      expect(next).toHaveBeenCalledOnce();
      expect(mockSetValue).toHaveBeenCalledWith('chat:123', sessionData);
    });

    it('should persist session modifications made via property setter', async () => {
      const initialData = { initial: true };
      const newValue = { updated: true };

      mockGetValue.mockResolvedValueOnce(initialData);
      const instance = new RedisMiddleware(makeOptions());
      const mw = instance.middleware();
      const context: any = {};

      const next = vi.fn().mockImplementation(async () => {
        context.chatSession = newValue;
      });

      await mw(context, next as unknown as NextFunction);

      expect(mockSetValue).toHaveBeenCalledWith('chat:123', expect.objectContaining(newValue));
    });

    it('should return loaded session via property getter', async () => {
      const sessionData = { sessionKey: 'sessionValue' };

      mockGetValue.mockResolvedValueOnce(sessionData);
      const instance = new RedisMiddleware(makeOptions());
      const mw = instance.middleware();
      const context: any = {};
      let capturedSession: unknown;

      const next = vi.fn().mockImplementation(async () => {
        capturedSession = context.chatSession;
      });

      await mw(context, next as unknown as NextFunction);

      expect(capturedSession).toEqual(sessionData);
    });
  });
});
