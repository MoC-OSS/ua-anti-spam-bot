import { Menu } from '@grammyjs/menu';

import { TestTensorListener } from '@bot/listeners/test-tensor.listener';

import { googleService } from '@services/google.service';

/**
 *
 */
vi.mock('@grammyjs/menu', () => ({
  // Must be a regular function (not arrow) so `new Menu(...)` works as a constructor.
  Menu: vi.fn().mockImplementation(function mockMenu(this: any) {
    this.text = vi.fn().mockReturnThis();
    this.row = vi.fn().mockReturnThis();
  }),
}));

vi.mock('@services/google.service', () => ({
  googleService: {
    // eslint-disable-next-line unicorn/no-useless-undefined
    appendToSheet: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@services/redis.service', () => ({
  redisService: {
    // eslint-disable-next-line unicorn/no-useless-undefined
    updateNegatives: vi.fn().mockResolvedValue(undefined),
    // eslint-disable-next-line unicorn/no-useless-undefined
    updatePositives: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@shared/config', () => ({
  environmentConfig: {
    GOOGLE_SPREADSHEET_ID: 'test-spreadsheet-id',
    DEBUG: false,
    ENV: 'test',
  },
}));

vi.mock('@utils/logger.util', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@bot/creator', () => ({
  creatorId: 123,
  trainingChat: -1_001_234_567_890,
}));

vi.mock('@const/google-sheets.const', () => ({
  GOOGLE_SHEETS_NAMES: {
    STRATEGIC_POSITIVE: 'Strategic_Positive',
    STRATEGIC_NEGATIVE: 'Strategic_Negative',
  },
}));

vi.mock('@utils/empty-functions.util', () => ({
  emptyFunction: vi.fn(),
  // eslint-disable-next-line unicorn/no-useless-undefined
  emptyPromiseFunction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@utils/error-handler.util', () => ({
  wrapperErrorHandler: vi.fn((functionArgument: any) => functionArgument),
}));

vi.mock('@message', () => ({
  getTensorTestResult: vi.fn().mockReturnValue('tensor test message'),
}));

const mockTensorService = {
  predict: vi.fn().mockResolvedValue({ isSpam: false, spamRate: 0.1 }),
} as any;

/**
 * Minimal context for getStorageKey / initTensorSession tests.
 * @param overrides
 */
function buildContext(overrides: Record<string, any> = {}): any {
  return {
    chat: { id: -100 },
    msg: { message_id: 42 },
    callbackQuery: undefined,
    from: undefined,
    ...overrides,
  };
}

/**
 * Richer context needed for button-handler and finalMiddleware tests.
 * `fromOverrides` are merged into callbackQuery.from.
 * @param fromOverrides
 */
function buildFullContext(fromOverrides: Record<string, any> = {}): any {
  return {
    chat: { id: -100 },
    msg: { message_id: 42, text: 'reply message text' },
    callbackQuery: {
      from: { id: 1, ...fromOverrides },
      chat_instance: 'instance-1',
    },
    update: {
      callback_query: {
        message: {
          reply_to_message: {
            text: 'original spam text',
            chat: { id: -200 },
            message_id: 99,
          },
        },
      },
    },
    menu: { update: vi.fn() },
    editMessageText: vi.fn().mockResolvedValue({}),
    api: {
      config: { use: vi.fn() },
      // eslint-disable-next-line unicorn/no-useless-undefined
      deleteMessage: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe('TestTensorListener', () => {
  let listener: TestTensorListener;

  beforeEach(() => {
    vi.clearAllMocks();
    listener = new TestTensorListener(mockTensorService);
  });

  // ─── constructor ────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('creates an instance with empty storage and timeout maps', () => {
      expect(listener).toBeInstanceOf(TestTensorListener);
      expect(listener.storage).toEqual({});
      expect(listener.messageNodeTimeouts).toEqual({});
      expect(listener.messageNodeIntervals).toEqual({});
    });
  });

  // ─── writeDataset ────────────────────────────────────────────────────────────

  describe('writeDataset', () => {
    it('calls appendToSheet with STRATEGIC_POSITIVE sheet for state=positives', async () => {
      await listener.writeDataset('positives', 'test word');

      expect(googleService.appendToSheet).toHaveBeenCalledWith('test-spreadsheet-id', 'Strategic_Positive', 'test word');
    });

    it('calls appendToSheet with STRATEGIC_NEGATIVE sheet for state=negatives', async () => {
      await listener.writeDataset('negatives', 'bad word');

      expect(googleService.appendToSheet).toHaveBeenCalledWith('test-spreadsheet-id', 'Strategic_Negative', 'bad word');
    });

    it('returns undefined and does not call appendToSheet for an unknown state', () => {
      const result = (listener as any).writeDataset('skips', 'word');

      expect(result).toBeUndefined();
      expect(googleService.appendToSheet).not.toHaveBeenCalled();
    });
  });

  // ─── getStorageKey ───────────────────────────────────────────────────────────

  describe('getStorageKey', () => {
    it('uses chat.id and message_id', () => {
      expect(listener.getStorageKey(buildContext())).toBe('-100:42');
    });

    it('prefers reply_to_message.message_id over message_id', () => {
      const context = buildContext({ msg: { message_id: 42, reply_to_message: { message_id: 10 } } });

      expect(listener.getStorageKey(context)).toBe('-100:10');
    });

    it('falls back to callbackQuery.chat_instance when chat is absent', () => {
      const context = buildContext({
        chat: undefined,
        callbackQuery: { chat_instance: 'abc123' },
        msg: { message_id: 42 },
      });

      expect(listener.getStorageKey(context)).toBe('abc123:42');
    });

    it('falls back to from.id when both chat and callbackQuery are absent', () => {
      const context = buildContext({
        chat: undefined,
        callbackQuery: undefined,
        from: { id: 999 },
        msg: { message_id: 42 },
      });

      expect(listener.getStorageKey(context)).toBe('999:42');
    });

    it('throws "No chat instance!" when all identifiers are absent', () => {
      const context = buildContext({ chat: undefined, callbackQuery: undefined, from: undefined });

      expect(() => listener.getStorageKey(context)).toThrow('No chat instance!');
    });

    it('throws "No message id!" when msg is absent', () => {
      expect(() => listener.getStorageKey(buildContext({ msg: undefined }))).toThrow('No message id!');
    });

    it('throws "No message id!" when msg exists but has no message_id', () => {
      expect(() => listener.getStorageKey(buildContext({ msg: {} }))).toThrow('No message id!');
    });
  });

  // ─── initTensorSession ───────────────────────────────────────────────────────

  describe('initTensorSession', () => {
    it('creates a new storage entry with empty arrays and correct defaults', () => {
      listener.initTensorSession(buildContext(), 'hello');

      expect(listener.storage['-100:42']).toEqual({
        positives: [],
        negatives: [],
        skips: [],
        originalMessage: 'hello',
        time: 30,
      });
    });

    it('does not overwrite an existing storage entry', () => {
      const context = buildContext();

      listener.initTensorSession(context, 'first');
      listener.initTensorSession(context, 'second');

      expect(listener.storage['-100:42'].originalMessage).toBe('first');
    });

    it('creates independent entries for different context keys', () => {
      const context1 = buildContext({ chat: { id: -100 }, msg: { message_id: 1 } });
      const context2 = buildContext({ chat: { id: -200 }, msg: { message_id: 2 } });

      listener.initTensorSession(context1, 'msg1');
      listener.initTensorSession(context2, 'msg2');

      expect(listener.storage['-100:1'].originalMessage).toBe('msg1');
      expect(listener.storage['-200:2'].originalMessage).toBe('msg2');
    });
  });

  // ─── initMenu ────────────────────────────────────────────────────────────────

  describe('initMenu', () => {
    it('returns a Menu instance and assigns it to this.menu', () => {
      const result = listener.initMenu(vi.fn() as any);

      expect(result).toBeDefined();
      expect(listener.menu).toBe(result);
      expect(Menu).toHaveBeenCalledWith('spam-menu');
    });

    /**
     * After mocking @grammyjs/menu, button-handler callbacks passed to .text()
     * are captured in textSpy.mock.calls and can be invoked directly.
     * wrapperErrorHandler is mocked as identity so wrapped functions are unchanged.
     */
    let spamHandler: (context: any) => void;
    let notSpamHandler: (context: any) => void;
    let skipHandler: (context: any) => void;

    beforeEach(() => {
      vi.useFakeTimers();
      vi.clearAllMocks();
      listener = new TestTensorListener(mockTensorService);
      listener.initMenu(vi.fn() as any);

      const textSpy = (listener.menu as any).text as ReturnType<typeof vi.fn>;

      // .text(labelFn, menuUpdateFn, handlerFn)
      // eslint-disable-next-line prefer-destructuring, unicorn/no-unreadable-array-destructuring
      [, , spamHandler] = textSpy.mock.calls[0];
      // .text(labelFn, handlerFn)
      // eslint-disable-next-line prefer-destructuring
      [, notSpamHandler] = textSpy.mock.calls[1];
      // .row() then .text(labelFn, handlerFn)
      // eslint-disable-next-line prefer-destructuring
      [, skipHandler] = textSpy.mock.calls[2];
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    // ── getAnyUsername (private) tested via spam button ──────────────────────

    describe('getAnyUsername (via spam button)', () => {
      it('returns @username when callbackQuery.from has a username', () => {
        const context = buildFullContext({ username: 'johndoe' });

        listener.initTensorSession(context, 'spam message');

        spamHandler(context);

        expect(listener.storage['-100:42'].positives).toContain('@johndoe');
      });

      it('returns "firstName lastName" when user has both names but no username', () => {
        const context = buildFullContext({ first_name: 'John', last_name: 'Doe' });

        listener.initTensorSession(context, 'spam message');

        spamHandler(context);

        expect(listener.storage['-100:42'].positives).toContain('John Doe');
      });

      it('returns firstName only when last_name is absent', () => {
        const context = buildFullContext({ first_name: 'Alice' });

        listener.initTensorSession(context, 'spam message');

        spamHandler(context);

        expect(listener.storage['-100:42'].positives).toContain('Alice');
      });

      it('returns empty string when no username info is present', () => {
        const context = buildFullContext({});

        listener.initTensorSession(context, 'spam message');

        spamHandler(context);

        expect(listener.storage['-100:42'].positives).toContain('');
      });
    });

    // ── spam button ──────────────────────────────────────────────────────────

    describe('spam button (✅)', () => {
      it('adds user to positives and removes them from negatives and skips', () => {
        const context = buildFullContext({ username: 'voter' });

        listener.initTensorSession(context, 'msg');
        listener.storage['-100:42'].negatives = ['@voter'];
        listener.storage['-100:42'].skips = ['@voter'];

        spamHandler(context);

        expect(listener.storage['-100:42'].positives).toContain('@voter');
        expect(listener.storage['-100:42'].negatives).not.toContain('@voter');
        expect(listener.storage['-100:42'].skips).not.toContain('@voter');
      });

      it('does not add a duplicate entry for the same user', () => {
        const context = buildFullContext({ username: 'voter' });

        listener.initTensorSession(context, 'msg');

        spamHandler(context);
        spamHandler(context);

        expect(listener.storage['-100:42'].positives!.filter((username) => username === '@voter')).toHaveLength(1);
      });
    });

    // ── not-spam button ──────────────────────────────────────────────────────

    describe('not-spam button (⛔️)', () => {
      it('adds user to negatives and removes them from positives and skips', () => {
        const context = buildFullContext({ username: 'voter' });

        listener.initTensorSession(context, 'msg');
        listener.storage['-100:42'].positives = ['@voter'];
        listener.storage['-100:42'].skips = ['@voter'];

        notSpamHandler(context);

        expect(listener.storage['-100:42'].negatives).toContain('@voter');
        expect(listener.storage['-100:42'].positives).not.toContain('@voter');
        expect(listener.storage['-100:42'].skips).not.toContain('@voter');
      });

      it('does not add a duplicate entry for the same user', () => {
        const context = buildFullContext({ username: 'voter' });

        listener.initTensorSession(context, 'msg');

        notSpamHandler(context);
        notSpamHandler(context);

        expect(listener.storage['-100:42'].negatives!.filter((username) => username === '@voter')).toHaveLength(1);
      });
    });

    // ── skip button ──────────────────────────────────────────────────────────

    describe('skip button (⏭)', () => {
      it('adds user to skips and removes them from positives and negatives', () => {
        const context = buildFullContext({ username: 'voter' });

        listener.initTensorSession(context, 'msg');
        listener.storage['-100:42'].positives = ['@voter'];
        listener.storage['-100:42'].negatives = ['@voter'];

        skipHandler(context);

        expect(listener.storage['-100:42'].skips).toContain('@voter');
        expect(listener.storage['-100:42'].positives).not.toContain('@voter');
        expect(listener.storage['-100:42'].negatives).not.toContain('@voter');
      });

      it('does not add a duplicate entry for the same user', () => {
        const context = buildFullContext({ username: 'voter' });

        listener.initTensorSession(context, 'msg');

        skipHandler(context);
        skipHandler(context);

        expect(listener.storage['-100:42'].skips!.filter((username) => username === '@voter')).toHaveLength(1);
      });
    });

    // ── finalMiddleware (triggered via the 30-second countdown timer) ────────

    describe('finalMiddleware (triggered via fake timers)', () => {
      it('calls editMessageText with msg.text when storage has been deleted', async () => {
        const context = buildFullContext({ username: 'voter' });

        listener.initTensorSession(context, 'some msg');

        // Calling a button handler sets up the countdown setTimeout.
        spamHandler(context);
        // Simulate storage expiry before the timer fires.
        delete listener.storage['-100:42'];

        await vi.advanceTimersByTimeAsync(31_000);

        expect(context.editMessageText).toHaveBeenCalledWith('reply message text', { reply_markup: undefined });
      });

      it('shows "Чекаю на більше оцінок..." when positives and negatives are tied', async () => {
        const context = buildFullContext({ username: 'userA' });

        // Pre-populate a tied vote (1 positive, 1 negative).
        listener.storage['-100:42'] = {
          positives: ['@userA'],
          negatives: ['@userB'],
          skips: [],
          originalMessage: 'original message',
          time: 30,
        };

        // Trigger processButtonMiddleware (userA already in positives so no duplicate).
        spamHandler(context);

        await vi.advanceTimersByTimeAsync(31_000);

        expect(context.editMessageText).toHaveBeenCalledWith(expect.stringContaining('Чекаю на більше оцінок...'));
      });

      it('calls writeDataset("positives") when positives win', async () => {
        const context = buildFullContext({ username: 'voter' });

        listener.storage['-100:42'] = {
          positives: ['@A', '@B'],
          negatives: [],
          skips: [],
          originalMessage: 'original',
          time: 30,
        };

        // voter votes spam → positives become ['@A', '@B', '@voter']
        spamHandler(context);

        await vi.advanceTimersByTimeAsync(31_000);

        expect(googleService.appendToSheet).toHaveBeenCalledWith('test-spreadsheet-id', 'Strategic_Positive', 'original spam text');
      });

      it('calls writeDataset("negatives") when negatives win', async () => {
        const context = buildFullContext({ username: 'voter' });

        listener.storage['-100:42'] = {
          positives: [],
          negatives: ['@A', '@B'],
          skips: [],
          originalMessage: 'original',
          time: 30,
        };

        // voter votes skip → skips = ['@voter'], negatives still win (2 vs 0 vs 1)
        skipHandler(context);

        await vi.advanceTimersByTimeAsync(31_000);

        expect(googleService.appendToSheet).toHaveBeenCalledWith('test-spreadsheet-id', 'Strategic_Negative', 'original spam text');
      });

      it('does not call writeDataset when skips win', async () => {
        const context = buildFullContext({ username: 'voter' });

        listener.storage['-100:42'] = {
          positives: [],
          negatives: [],
          skips: ['@A', '@B'],
          originalMessage: 'original',
          time: 30,
        };

        // voter also skips → skips = ['@A', '@B', '@voter']
        skipHandler(context);

        await vi.advanceTimersByTimeAsync(31_000);

        expect(googleService.appendToSheet).not.toHaveBeenCalled();
      });
    });
  });
});
