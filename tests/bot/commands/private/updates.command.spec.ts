import { UpdatesCommand } from '@bot/commands/private/updates.command';

// ---------------------------------------------------------------------------
// Hoisted mocks – created before any imports so vi.mock() factories can use them
// ---------------------------------------------------------------------------

const {
  mockGetChatSessions,
  mockGetSuccessfulMessage,
  mockGetUpdateMessage,
  mockGetUpdatesMessage,
  mockHandleError,
  mockBottleneckConstructor,
} = vi.hoisted(() => ({
  mockGetChatSessions: vi.fn(),
  mockGetSuccessfulMessage: vi.fn(),
  mockGetUpdateMessage: vi.fn(),
  mockGetUpdatesMessage: vi.fn(),
  mockHandleError: vi.fn(),
  /** Initialised with a no-op; reset in beforeEach via mockImplementation. */
  mockBottleneckConstructor: vi.fn(),
}));

/**
 * Creates a lightweight synchronous Bottleneck substitute.
 * Must be a `function` declaration (not an arrow) because vitest 4.x
 * calls `new implementation()` when the mock is invoked with `new`.
 *
 * - `schedule` calls the job immediately and fires the `done` handler.
 * - `on('empty', handler)` defers the handler to the next microtask
 *   so the outer Promise resolves after all scheduled jobs complete.
 */
function createBottleneckInstance() {
  const handlers = new Map<string, (...arguments_: unknown[]) => void>();

  return {
    schedule: vi.fn().mockImplementation(async (scheduledTask: () => Promise<unknown>) => {
      try {
        await scheduledTask();
      } catch {
        // errors are forwarded by the real code via .catch(handleError)
      }

      handlers.get('done')?.();
    }),
    on: vi.fn().mockImplementation((event: string, handler: (...arguments_: unknown[]) => void) => {
      handlers.set(event, handler);

      if (event === 'empty') {
        Promise.resolve().then(handler);
      }
    }),
  };
}

vi.mock('@services/redis.service', () => ({
  redisService: {
    getChatSessions: mockGetChatSessions,
  },
}));

vi.mock('@utils/logger.util', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));

vi.mock('@utils/error-handler.util', () => ({ handleError: mockHandleError }));

vi.mock('@message', () => ({
  getSuccessfulMessage: mockGetSuccessfulMessage,
  getUpdateMessage: mockGetUpdateMessage,
  getUpdatesMessage: mockGetUpdatesMessage,
}));

vi.mock('bottleneck', () => ({
  default: mockBottleneckConstructor,
}));

// ---------------------------------------------------------------------------
// Context factory
// ---------------------------------------------------------------------------

const createMockContext = (sessionOverrides?: Record<string, unknown>) =>
  ({
    msg: { text: 'Test update message', entities: [], message_id: 1 },
    chat: { id: 12_345 },
    from: { id: 123 },
    session: { step: 'idle', updatesText: '', textEntities: undefined, ...sessionOverrides },
    reply: vi.fn().mockResolvedValue({ message_id: 1 }),
    // eslint-disable-next-line unicorn/no-useless-undefined
    replyWithChatAction: vi.fn().mockResolvedValue(undefined),
    t: vi.fn((key: string, parameters?: unknown) => (parameters ? `${key}:${JSON.stringify(parameters)}` : key)),
    api: {
      sendMessage: vi.fn().mockResolvedValue({ message_id: 2 }),
    },
    match: undefined,
  }) as any;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('UpdatesCommand', () => {
  let command: UpdatesCommand;

  beforeEach(() => {
    vi.resetAllMocks();

    // Re-apply default implementations after resetAllMocks() clears them.
    mockBottleneckConstructor.mockImplementation(createBottleneckInstance);
    mockGetChatSessions.mockResolvedValue([]);
    mockGetSuccessfulMessage.mockReturnValue('success');
    mockGetUpdateMessage.mockReturnValue('update message');
    mockGetUpdatesMessage.mockReturnValue('updates message');

    command = new UpdatesCommand();
  });

  // -------------------------------------------------------------------------
  // initMenu
  // -------------------------------------------------------------------------

  describe('initMenu', () => {
    describe('positive cases', () => {
      it('should return a truthy Menu object', () => {
        const menu = command.initMenu();

        expect(menu).toBeDefined();
        expect(menu).not.toBeNull();
      });

      it('should set the internal menu property to the returned value', () => {
        const menu = command.initMenu();

        expect(menu).toBe(command['menu']);
      });
    });
  });

  // -------------------------------------------------------------------------
  // initialization
  // -------------------------------------------------------------------------

  describe('initialization', () => {
    describe('positive cases', () => {
      it('should return a function', () => {
        expect(typeof command.initialization()).toBe('function');
      });

      it('should set session step to confirmation and reply with the updates message', async () => {
        const handler = command.initialization();
        const context = createMockContext();

        await handler(context);

        expect(context.session.step).toBe('confirmation');
        expect(context.reply).toHaveBeenCalledWith('updates message', { parse_mode: 'HTML' });
      });
    });
  });

  // -------------------------------------------------------------------------
  // confirmation
  // -------------------------------------------------------------------------

  describe('confirmation', () => {
    describe('positive cases', () => {
      it('should return a function', () => {
        expect(typeof command.confirmation()).toBe('function');
      });

      it('should call the middleware logic (sets step to messageSending)', async () => {
        const context = createMockContext();
        const bound = command.confirmation();

        await bound(context);

        expect(context.session.step).toBe('messageSending');
      });
    });
  });

  // -------------------------------------------------------------------------
  // middleware
  // -------------------------------------------------------------------------

  describe('middleware', () => {
    describe('positive cases', () => {
      it('should set session step to messageSending and copy the text', async () => {
        const context = createMockContext();

        await command.middleware(context);

        expect(context.session.step).toBe('messageSending');
        expect(context.session.updatesText).toBe('Test update message');
      });

      it('should assign textEntities from msg.entities when defined', async () => {
        const entities = [{ type: 'bold', offset: 0, length: 4 }];
        const context = createMockContext();

        context.msg.entities = entities;

        await command.middleware(context);

        expect(context.session.textEntities).toEqual(entities);
      });

      it('should set textEntities to undefined when msg.entities is absent', async () => {
        const context = createMockContext();

        context.msg = { text: 'hello', entities: undefined, message_id: 1 };

        await command.middleware(context);

        expect(context.session.textEntities).toBeUndefined();
      });

      it('should include the filtered session count in the reply', async () => {
        const sessions = [
          { id: '1', payload: { chatType: 'supergroup', botRemoved: false } },
          { id: '2', payload: { chatType: 'private', botRemoved: false } },
          { id: '3', payload: { chatType: 'group', botRemoved: false } }, // filtered out
          { id: '4', payload: { chatType: 'supergroup', botRemoved: true } }, // filtered out
        ];

        mockGetChatSessions.mockResolvedValue(sessions);

        const context = createMockContext();

        await command.middleware(context);

        // The second reply argument includes the count string
        expect(context.reply).toHaveBeenCalledWith(expect.stringContaining('updates-total-chats'));
      });

      it('should reply with the user input text via the menu', async () => {
        const context = createMockContext();

        await command.middleware(context);

        expect(context.reply).toHaveBeenCalledWith('Test update message', expect.objectContaining({ reply_markup: command['menu'] }));
      });

      it('should reply with an empty string when msg.text is undefined', async () => {
        const context = createMockContext();

        context.msg = { text: undefined, entities: undefined, message_id: 1 };

        await command.middleware(context);

        expect(context.reply).toHaveBeenCalledWith('', expect.anything());
      });
    });
  });

  // -------------------------------------------------------------------------
  // messageSending
  // -------------------------------------------------------------------------

  describe('messageSending', () => {
    describe('cancel path', () => {
      it('should reply with updates-cancelled and reset step to idle', async () => {
        const handler = command.messageSending();
        const context = { ...createMockContext(), match: 'cancel' };

        await handler(context);

        expect(context.reply).toHaveBeenCalledWith('updates-cancelled');
        expect(context.session.step).toBe('idle');
      });
    });

    describe('approve path', () => {
      it('should call getChatSessions and set step to idle', async () => {
        const sessions = [
          { id: '1', payload: { chatType: 'supergroup', botRemoved: false } },
          { id: '2', payload: { chatType: 'private', botRemoved: false } },
        ];

        mockGetChatSessions.mockResolvedValue(sessions);

        const handler = command.messageSending();

        const context = {
          ...createMockContext({ updatesText: 'msg', textEntities: undefined }),
          match: 'approve',
        };

        await handler(context);

        expect(mockGetChatSessions).toHaveBeenCalledOnce();
        expect(context.session.step).toBe('idle');
      });

      it('should send messages only to active supergroup and private sessions', async () => {
        const sessions = [
          { id: '10', payload: { chatType: 'supergroup', botRemoved: false } },
          { id: '20', payload: { chatType: 'private', botRemoved: false } },
          { id: '30', payload: { chatType: 'group', botRemoved: false } }, // filtered
          { id: '40', payload: { chatType: 'supergroup', botRemoved: true } }, // filtered
        ];

        mockGetChatSessions.mockResolvedValue(sessions);

        const handler = command.messageSending();

        const context = {
          ...createMockContext({ updatesText: 'hello', textEntities: undefined }),
          match: 'approve',
        };

        await handler(context);

        expect(context.api.sendMessage).toHaveBeenCalledTimes(2);
        expect(context.api.sendMessage).toHaveBeenCalledWith('10', 'hello', { entities: undefined });
        expect(context.api.sendMessage).toHaveBeenCalledWith('20', 'hello', { entities: undefined });
      });
    });
  });

  // -------------------------------------------------------------------------
  // bulkSending
  // -------------------------------------------------------------------------

  describe('bulkSending', () => {
    describe('positive cases', () => {
      it('should resolve with an empty session list', async () => {
        const context = createMockContext({ updatesText: 'hi', textEntities: undefined });

        await expect(command.bulkSending(context, [], 'supergroup')).resolves.toBeUndefined();
      });

      it('should call sendMessage for each session', async () => {
        const sessions = [
          { id: '100', payload: {} },
          { id: '200', payload: {} },
        ];

        const context = createMockContext({ updatesText: 'broadcast', textEntities: undefined });

        await command.bulkSending(context, sessions as any, 'supergroup');

        expect(context.api.sendMessage).toHaveBeenCalledTimes(2);
        expect(context.api.sendMessage).toHaveBeenCalledWith('100', 'broadcast', { entities: undefined });
        expect(context.api.sendMessage).toHaveBeenCalledWith('200', 'broadcast', { entities: undefined });
      });

      it('should use empty string when updatesText is undefined', async () => {
        const sessions = [{ id: '300', payload: {} }];
        const context = createMockContext({ updatesText: undefined, textEntities: undefined });

        await command.bulkSending(context, sessions as any, 'private');

        expect(context.api.sendMessage).toHaveBeenCalledWith('300', '', { entities: undefined });
      });

      it('should pass entities when textEntities is defined', async () => {
        const entities = [{ type: 'bold', offset: 0, length: 4 }];
        const sessions = [{ id: '400', payload: {} }];
        const context = createMockContext({ updatesText: 'bold text', textEntities: entities });

        await command.bulkSending(context, sessions as any, 'supergroup');

        expect(context.api.sendMessage).toHaveBeenCalledWith('400', 'bold text', { entities });
      });

      it('should reply with the success message after sending', async () => {
        const sessions = [{ id: '500', payload: {} }];
        const context = createMockContext({ updatesText: 'done', textEntities: undefined });

        await command.bulkSending(context, sessions as any, 'supergroup');

        expect(context.reply).toHaveBeenCalledWith('success');
      });
    });
  });
});
