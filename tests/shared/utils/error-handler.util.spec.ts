import { GrammyError, HttpError } from 'grammy';

import { globalErrorHandler, handleError, wrapperErrorHandler } from '@utils/error-handler.util';

vi.mock('@bot/creator', () => ({
  logsChat: -1_234_567_890,
}));

vi.mock('@shared/config', () => ({
  environmentConfig: {
    DEBUG: false,
  },
}));

vi.mock('@utils/optimize-write-context.util', () => ({
  optimizeWriteContextUtility: vi.fn(() => ({ update: {}, state: {} })),
}));

function buildMockContext(apiOverrides: Record<string, unknown> = {}): any {
  return {
    update: { update_id: 42 },
    chat: { id: -100, title: 'Test Chat' },
    from: { id: 1, first_name: 'Test', username: 'testuser' },
    state: { photo: undefined, nsfwResult: undefined },
    tg: {},
    getChat: vi.fn(() => Promise.resolve({ id: -100, title: 'Test Chat' })),
    api: {
      sendMessage: vi.fn(() => Promise.resolve({})),
      sendDocument: vi.fn(() => Promise.resolve({})),
      ...apiOverrides,
    },
  };
}

describe('handleError', () => {
  describe('positive cases', () => {
    it('should not throw when called with an Error', () => {
      expect(() => handleError(new Error('test'), 'reason')).not.toThrow();
    });

    it('should not throw when called with no reason', () => {
      expect(() => handleError(new Error('test'))).not.toThrow();
    });

    it('should not throw when called with a string error', () => {
      expect(() => handleError('string error', 'reason')).not.toThrow();
    });

    it('should not throw when called with unknown value', () => {
      expect(() => handleError(null, '')).not.toThrow();
    });
  });
});

describe('globalErrorHandler', () => {
  describe('positive cases', () => {
    it('should not throw for a GrammyError', () => {
      const context = buildMockContext();
      const grammyError = new GrammyError('Bot API error', { ok: false, error_code: 400, description: 'Bad Request' } as any, '', {});
      const botError = { ctx: context, error: grammyError } as any;

      expect(() => globalErrorHandler(botError)).not.toThrow();
    });

    it('should not throw for an HttpError', () => {
      const context = buildMockContext();
      const httpError = new HttpError('connection failed', new Error('connection failed'));
      const botError = { ctx: context, error: httpError } as any;

      expect(() => globalErrorHandler(botError)).not.toThrow();
    });

    it('should not throw for an unknown error', () => {
      const context = buildMockContext();
      const botError = { ctx: context, error: new Error('unknown') } as any;

      expect(() => globalErrorHandler(botError)).not.toThrow();
    });
  });
});

describe('wrapperErrorHandler', () => {
  describe('positive cases', () => {
    it('should call the callback and pass through to next', async () => {
      const callback = vi.fn(async (_context: any, next: any) => next());
      const next = vi.fn(() => Promise.resolve());
      const context = buildMockContext();
      const wrapped = wrapperErrorHandler(callback);

      await wrapped(context, next);

      expect(callback).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledOnce();
    });

    it('should catch errors thrown by the callback and call next', async () => {
      const error = new Error('test error');

      const callback = vi.fn(async () => {
        throw error;
      });

      const next = vi.fn(() => Promise.resolve());
      const context = buildMockContext();
      const wrapped = wrapperErrorHandler(callback);

      await expect(wrapped(context, next)).resolves.not.toThrow();
    });

    it('should call sendMessage when error is an Error instance and DEBUG is false', async () => {
      const error = new Error('boom');

      const context = buildMockContext({
        sendMessage: vi.fn(() => Promise.resolve({ ok: true })),
      });

      const callback = vi.fn(async () => {
        throw error;
      });

      const next = vi.fn(() => Promise.resolve());
      const wrapped = wrapperErrorHandler(callback);

      await wrapped(context, next);

      expect(context.api.sendMessage).toHaveBeenCalled();
    });

    it('should not throw when callback is falsy (logs the error and calls next)', async () => {
      const next = vi.fn(() => Promise.resolve());
      const context = buildMockContext();
      const wrapped = wrapperErrorHandler(null as any);

      // When callback is falsy, it logs an error and throws TypeError - caught internally
      await wrapped(context, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
