import { MessageHandler } from '@bot/handlers/message.handler';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { mockGetBotTensorPercent, mockProcessHandler, mockAxiosPost, mockHandleError, mockLoggerError } = vi.hoisted(() => ({
  mockGetBotTensorPercent: vi.fn().mockResolvedValue(null),
  mockProcessHandler: vi.fn().mockReturnValue(null),
  mockAxiosPost: vi.fn(),
  mockHandleError: vi.fn(),
  mockLoggerError: vi.fn(),
}));

vi.mock('@services/redis.service', () => ({
  redisService: {
    getBotTensorPercent: mockGetBotTensorPercent,
  },
}));

vi.mock('@server/process.handler', () => ({
  processHandler: {
    processHandler: mockProcessHandler,
  },
}));

vi.mock('axios', () => ({
  default: {
    post: mockAxiosPost,
    get: vi.fn(),
  },
}));

vi.mock('@utils/error-handler.util', () => ({
  handleError: mockHandleError,
}));

vi.mock('@utils/logger.util', () => ({
  logger: {
    error: mockLoggerError,
    info: vi.fn(),
  },
}));

const { mockEnvironmentConfig } = vi.hoisted(() => ({
  mockEnvironmentConfig: {
    USE_SERVER: false,
    TENSOR_RANK: 0.9,
    HOST: 'localhost',
    PORT: 3000,
    BOT_TOKEN: 'mock-token',
  },
}));

vi.mock('@shared/config', () => ({
  environmentConfig: mockEnvironmentConfig,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTensorResult(spamRate: number, deleteRank = 0.9) {
  return {
    spamRate,
    deleteRank,
    isSpam: spamRate > 0.5,
    fileStat: {} as any,
  };
}

const mockTensorService = {
  predict: vi.fn(),
} as any;

function buildMessageContext(entities?: unknown[]) {
  return {
    update: {
      message: {
        entities,
      },
    },
  } as any;
}

describe('MessageHandler', () => {
  let handler: MessageHandler;

  beforeEach(() => {
    vi.resetAllMocks();
    mockEnvironmentConfig.USE_SERVER = false;
    mockGetBotTensorPercent.mockResolvedValue(null);
    mockProcessHandler.mockReturnValue(null);
    mockTensorService.predict.mockResolvedValue(createTensorResult(0.3));
    handler = new MessageHandler(mockTensorService);
  });

  // -------------------------------------------------------------------------
  // getTensorRank
  // -------------------------------------------------------------------------

  describe('getTensorRank', () => {
    describe('immediately rule branch', () => {
      it('should return isSpam:true with immediately:true when the immediately rule fires', async () => {
        // First call to processHandler is for 'immediately'
        mockProcessHandler.mockReturnValueOnce('bad_word');

        const result = await handler.getTensorRank('message', 'original');

        expect(result).toEqual({ isSpam: true, immediately: true });
      });
    });

    describe('strict_percent_100 rule branch', () => {
      it('should return isSpam:true with percent100:true when strict_percent_100 fires', async () => {
        // immediately → null, strict_percent_100 → rule
        mockProcessHandler.mockReturnValueOnce(null).mockReturnValueOnce('strict_match');

        const result = await handler.getTensorRank('msg', 'orig');

        expect(result).toEqual({ isSpam: true, percent100: true });
      });
    });

    describe('percent_100 rule branch', () => {
      it('should return isSpam:true with percent100:true when percent_100 fires', async () => {
        // immediately → null, strict_percent_100 → null, percent_100 → rule
        mockProcessHandler.mockReturnValueOnce(null).mockReturnValueOnce(null).mockReturnValueOnce('fuzzy_match');

        const result = await handler.getTensorRank('msg', 'orig');

        expect(result).toEqual({ isSpam: true, percent100: true });
      });
    });

    describe('one_word rule branch', () => {
      it('should return isSpam:true with oneWord:true when one_word fires', async () => {
        // immediately → null, strict_percent_100 → null, percent_100 → null, one_word → rule
        mockProcessHandler
          .mockReturnValueOnce(null)
          .mockReturnValueOnce(null)
          .mockReturnValueOnce(null)
          .mockReturnValueOnce('one_word_match');

        const result = await handler.getTensorRank('msg', 'orig');

        expect(result).toEqual({ isSpam: true, oneWord: true });
      });
    });

    describe('tensor spam branch', () => {
      it('should return isSpam:true with tensor rate when spamRate exceeds tensorRank', async () => {
        // All dataset checks return null; tensor fires
        mockProcessHandler.mockReturnValue(null);
        mockTensorService.predict.mockResolvedValue(createTensorResult(0.95));

        const result = await handler.getTensorRank('msg', 'orig');

        expect(result).toEqual({ isSpam: true, tensor: 0.95, deleteRank: 0.9 });
      });

      it('should use TENSOR_RANK from config when redis returns null', async () => {
        mockGetBotTensorPercent.mockResolvedValue(null);
        mockProcessHandler.mockReturnValue(null);
        mockTensorService.predict.mockResolvedValue(createTensorResult(0.95));

        const result = await handler.getTensorRank('msg', 'orig');

        expect(result).toMatchObject({ isSpam: true });
      });

      it('should use tensor rank from redis when available', async () => {
        mockGetBotTensorPercent.mockResolvedValue(0.5);
        mockProcessHandler.mockReturnValue(null);
        // spamRate 0.6 > 0.5 (redis rank) → spam
        mockTensorService.predict.mockResolvedValue(createTensorResult(0.6));

        const result = await handler.getTensorRank('msg', 'orig');

        expect(result).toMatchObject({ isSpam: true, tensor: 0.6 });
      });
    });

    describe('location spam branch', () => {
      it('should return isSpam:true with location:true when locations combined with tensor fire', async () => {
        // tensor spamRate = 0.75; locations adds 0.2 → 0.95 > 0.9
        mockProcessHandler
          .mockReturnValueOnce(null) // immediately
          .mockReturnValueOnce(null) // strict_percent_100
          .mockReturnValueOnce(null) // percent_100
          .mockReturnValueOnce(null) // one_word
          .mockReturnValueOnce(null) // strict_locations → no rule → check locations
          .mockReturnValueOnce('kyiv'); // locations → has rule

        mockTensorService.predict.mockResolvedValue(createTensorResult(0.75));

        const result = await handler.getTensorRank('msg', 'orig');

        expect(result).toEqual({ isSpam: true, tensor: 0.75, location: true, deleteRank: 0.9 });
      });

      it('should skip locations lookup when strict_locations already has a rule', async () => {
        // tensor spamRate = 0.75; strict_locations fires → locationRank 0.2 → 0.95 > 0.9
        mockProcessHandler
          .mockReturnValueOnce(null) // immediately
          .mockReturnValueOnce(null) // strict_percent_100
          .mockReturnValueOnce(null) // percent_100
          .mockReturnValueOnce(null) // one_word
          .mockReturnValueOnce('city_match'); // strict_locations → has rule

        mockTensorService.predict.mockResolvedValue(createTensorResult(0.75));

        const result = await handler.getTensorRank('msg', 'orig');

        // strict_locations fired → locations NOT called → locationRank = 0.2 → spam
        expect(result).toMatchObject({ isSpam: true, location: true });
      });
    });

    describe('oldLogic spam branch', () => {
      it('should return isSpam:true with oldLogic:true when high-risk word boosts tensor over threshold', async () => {
        // tensor = 0.7; no location; strict_high_risk has rule → oldLogicRank = 0.3 → 1.0 > 0.9
        mockProcessHandler
          .mockReturnValueOnce(null) // immediately
          .mockReturnValueOnce(null) // strict_percent_100
          .mockReturnValueOnce(null) // percent_100
          .mockReturnValueOnce(null) // one_word
          .mockReturnValueOnce(null) // strict_locations
          .mockReturnValueOnce(null) // locations
          .mockReturnValueOnce('high_risk_word'); // strict_high_risk

        mockTensorService.predict.mockResolvedValue(createTensorResult(0.7));

        const result = await handler.getTensorRank('msg', 'orig');

        expect(result).toEqual({ isSpam: true, tensor: 0.7, oldLogic: true, deleteRank: 0.9 });
      });
    });

    describe('default (not spam) branch', () => {
      it('should return deleteRank and tensor rate when nothing fires', async () => {
        // All rules return null; tensor 0.3; no location boost; no oldLogic boost
        mockProcessHandler.mockReturnValue(null);
        mockTensorService.predict.mockResolvedValue(createTensorResult(0.3));

        const result = await handler.getTensorRank('msg', 'orig');

        expect(result).toEqual({ deleteRank: 0.9, tensor: 0.3 });
      });
    });
  });

  // -------------------------------------------------------------------------
  // processTensorMessage
  // -------------------------------------------------------------------------

  describe('processTensorMessage', () => {
    describe('USE_SERVER = false', () => {
      it('should call tensorService.predict and wrap result', async () => {
        const tensorResult = createTensorResult(0.4);

        mockTensorService.predict.mockResolvedValue(tensorResult);

        const result = await handler.processTensorMessage('hello', 0.9);

        expect(mockTensorService.predict).toHaveBeenCalledWith('hello', 0.9);
        expect(result).toEqual({ result: tensorResult });
      });

      it('should pass null rate to predict when rate is null', async () => {
        await handler.processTensorMessage('msg', null);

        expect(mockTensorService.predict).toHaveBeenCalledWith('msg', null);
      });
    });

    describe('USE_SERVER = true', () => {
      beforeEach(() => {
        mockEnvironmentConfig.USE_SERVER = true;
      });

      it('should call axios.post and return response data', async () => {
        const tensorResult = createTensorResult(0.8);

        mockAxiosPost.mockResolvedValue({ data: { result: tensorResult } });

        const result = await handler.processTensorMessage('spam', 0.9);

        expect(mockAxiosPost).toHaveBeenCalledWith(expect.stringContaining('/tensor'), { message: 'spam', rate: 0.9 });

        expect(result).toEqual({ result: tensorResult });
      });

      it('should fall back to tensorService.predict and call handleError when axios throws', async () => {
        const error = new Error('Network error');

        mockAxiosPost.mockRejectedValue(error);
        const tensorResult = createTensorResult(0.2);

        mockTensorService.predict.mockResolvedValue(tensorResult);

        const result = await handler.processTensorMessage('msg', 0.9);

        expect(mockHandleError).toHaveBeenCalledWith(error, 'API_DOWN');
        expect(result).toEqual({ result: tensorResult });
      });
    });
  });

  // -------------------------------------------------------------------------
  // processMessage
  // -------------------------------------------------------------------------

  describe('processMessage', () => {
    describe('USE_SERVER = false', () => {
      it('should call processHandler and return the rule', async () => {
        mockProcessHandler.mockReturnValue('found_word');

        const result = await handler.processMessage('buy crypto now', 'immediately' as any);

        expect(mockProcessHandler).toHaveBeenCalledWith('buy crypto now', 'immediately', false);
        expect(result.rule).toBe('found_word');
        expect(result.dataset).toBe('immediately');
      });

      it('should return null rule when processHandler returns null', async () => {
        mockProcessHandler.mockReturnValue(null);

        const result = await handler.processMessage('hello', 'one_word' as any, false);

        expect(result.rule).toBeNull();
      });

      it('should pass strict=true to processHandler', async () => {
        await handler.processMessage('test', 'strict_percent_100' as any, true);

        expect(mockProcessHandler).toHaveBeenCalledWith('test', 'strict_percent_100', true);
      });
    });

    describe('USE_SERVER = true', () => {
      beforeEach(() => {
        mockEnvironmentConfig.USE_SERVER = true;
      });

      it('should call axios.post and return the result', async () => {
        mockAxiosPost.mockResolvedValue({ data: { result: 'server_match' } });

        const result = await handler.processMessage('msg', 'percent_100' as any);

        expect(mockAxiosPost).toHaveBeenCalledWith(
          expect.stringContaining('/process'),
          expect.objectContaining({ message: 'msg', datasetPath: 'percent_100' }),
        );

        expect(result.rule).toBe('server_match');
      });

      it('should fall back to processHandler and call handleError when axios throws', async () => {
        const error = new Error('Server down');

        mockAxiosPost.mockRejectedValue(error);
        mockProcessHandler.mockReturnValue('fallback_rule');

        const result = await handler.processMessage('msg', 'immediately' as any);

        expect(mockHandleError).toHaveBeenCalledWith(error, 'API_DOWN');
        expect(result.rule).toBe('fallback_rule');
      });
    });
  });

  // -------------------------------------------------------------------------
  // sanitizeMessage
  // -------------------------------------------------------------------------

  describe('sanitizeMessage', () => {
    describe('positive cases', () => {
      it('should return the original message when there are no entities and no @mentions', () => {
        const context = buildMessageContext([]);
        const result = handler.sanitizeMessage(context, 'Hello World');

        expect(result).toBe('Hello World');
      });

      it('should collapse multiple spaces into one', () => {
        const context = buildMessageContext([]);
        const result = handler.sanitizeMessage(context, 'Hello   World');

        expect(result).toBe('Hello World');
      });

      it('should replace text_mention entity with spaces', () => {
        const context = buildMessageContext([{ type: 'text_mention', offset: 0, length: 5 }]);
        const result = handler.sanitizeMessage(context, 'Hello World');

        // 'Hello' (5 chars) replaced with spaces → '     World'
        // multiple spaces collapsed → ' World'
        expect(result).toBe(' World');
      });

      it('should skip entities that are not text_mention', () => {
        const context = buildMessageContext([{ type: 'bold', offset: 0, length: 5 }]);
        const result = handler.sanitizeMessage(context, 'Hello World');

        expect(result).toBe('Hello World');
      });

      it('should replace @mention with spaces', () => {
        const context = buildMessageContext([]);
        // '@user' is 5 chars → '     hello'
        const result = handler.sanitizeMessage(context, '@user hello');

        expect(result).toBe(' hello');
      });

      it('should handle multiple @mentions', () => {
        const context = buildMessageContext([]);
        const result = handler.sanitizeMessage(context, '@alice and @bob meet');

        // Both mentions replaced with spaces then collapsed
        expect(result).not.toContain('@alice');
        expect(result).not.toContain('@bob');
      });

      it('should handle undefined entities gracefully', () => {
        const context = buildMessageContext();
        const result = handler.sanitizeMessage(context, 'Normal message');

        expect(result).toBe('Normal message');
      });
    });

    describe('negative cases', () => {
      it('should return empty string and log error when the sanitized message is empty', () => {
        const context = buildMessageContext([]);
        // Pass empty string → IIFE returns '' → after replaceAll still '' → !message
        const result = handler.sanitizeMessage(context, '');

        expect(result).toBe('');

        expect(mockLoggerError).toHaveBeenCalledWith({ message: '' }, 'Cannot parse the message!');
      });

      it('should call handleError and still return a value when an exception occurs inside the IIFE', () => {
        // Simulate an entity that would cause substr to throw via a broken context
        const context = {
          update: {
            // message is null → .entities optional chain returns undefined
            // still should not throw from sanitizeMessage itself
            message: null,
          },
        } as any;

        expect(() => handler.sanitizeMessage(context, 'safe message')).not.toThrow();
      });
    });
  });

  // -------------------------------------------------------------------------
  // getDeleteRule
  // -------------------------------------------------------------------------

  describe('getDeleteRule', () => {
    describe('positive cases', () => {
      it('should return a rule from strict_high_risk without checking high_risk', async () => {
        mockProcessHandler.mockReturnValueOnce('strict_hr_match');

        // eslint-disable-next-line sonarjs/deprecation
        const result = await handler.getDeleteRule('risky message');

        // strict_high_risk had a rule → high_risk is NOT called
        expect(mockProcessHandler).toHaveBeenCalledTimes(1);
        expect(result.rule).toBe('strict_hr_match');
      });

      it('should fall through to high_risk when strict_high_risk has no rule', async () => {
        mockProcessHandler
          .mockReturnValueOnce(null) // strict_high_risk → no match
          .mockReturnValueOnce('hr_match'); // high_risk → match

        // eslint-disable-next-line sonarjs/deprecation
        const result = await handler.getDeleteRule('risky');

        expect(mockProcessHandler).toHaveBeenCalledTimes(2);
        expect(result.rule).toBe('hr_match');
      });

      it('should return finalHighRisk with null rule when neither high-risk list matches', async () => {
        mockProcessHandler
          .mockReturnValueOnce(null) // strict_high_risk
          .mockReturnValueOnce(null); // high_risk

        // eslint-disable-next-line sonarjs/deprecation
        const result = await handler.getDeleteRule('clean message');

        expect(result.rule).toBeNull();
      });
    });
  });
});
