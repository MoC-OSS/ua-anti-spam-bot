import type { NextFunction } from 'grammy';

import { GlobalMiddleware } from '@bot/middleware/global.middleware';

import type { GrammyContext } from '@app-types/context';

const { mockHandleError, mockGetChatTitle, mockEnvConfig } = vi.hoisted(() => ({
  mockHandleError: vi.fn(),
  mockGetChatTitle: vi.fn().mockReturnValue('Mock Title'),
  mockEnvConfig: { DEBUG: false } as Record<string, unknown>,
}));

vi.mock('@shared/config', () => ({
  environmentConfig: mockEnvConfig,
}));

vi.mock('@utils/error-handler.util', () => ({
  handleError: mockHandleError,
}));

vi.mock('@utils/util-instances.util', () => ({
  telegramUtility: {
    getChatTitle: mockGetChatTitle,
  },
}));

vi.mock('@utils/empty-functions.util', () => ({
  emptyFunction: vi.fn(),
}));

vi.mock('@utils/logger.util', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

/**
 *
 * @param overrides
 */
function makeContext(overrides: Record<string, unknown> = {}): GrammyContext {
  return {
    chat: { type: 'supergroup', title: 'Test Chat' },
    chatSession: {
      chatSettings: {
        airRaidAlertSettings: { pageNumber: 1, state: null, notificationMessage: false },
        disableChatWhileAirRaidAlert: false,
      },
    },
    myChatMember: { new_chat_member: { status: 'member' } },
    getChatMembersCount: vi.fn().mockResolvedValue(50),
    ...overrides,
  } as unknown as GrammyContext;
}

describe('GlobalMiddleware', () => {
  let globalMiddleware: GlobalMiddleware;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    globalMiddleware = new GlobalMiddleware();
    // eslint-disable-next-line unicorn/no-useless-undefined
    next = vi.fn().mockResolvedValue(undefined);
    vi.clearAllMocks();
    // eslint-disable-next-line unicorn/no-useless-undefined
    next = vi.fn().mockResolvedValue(undefined);
    mockEnvConfig.DEBUG = false;
  });

  describe('middleware()', () => {
    describe('when chatSession or session is missing', () => {
      it('should call next without handleError when chatSession is missing and DEBUG is false', async () => {
        const context = {
          chat: { type: 'supergroup' },
          chatSession: undefined,
          session: {},
        } as unknown as GrammyContext;

        await globalMiddleware.middleware()(context, next as unknown as NextFunction);

        expect(next).toHaveBeenCalledOnce();
        expect(mockHandleError).not.toHaveBeenCalled();
      });

      it('should call handleError and next when chatSession is missing, DEBUG is true, non-channel', async () => {
        mockEnvConfig.DEBUG = true;

        const context = {
          chat: { type: 'supergroup' },
          chatSession: undefined,
          session: {},
        } as unknown as GrammyContext;

        await globalMiddleware.middleware()(context, next as unknown as NextFunction);

        expect(next).toHaveBeenCalledOnce();
        expect(mockHandleError).toHaveBeenCalledOnce();
      });

      it('should NOT call handleError when chatSession is missing, DEBUG is true, but chat type is channel', async () => {
        mockEnvConfig.DEBUG = true;

        const context = {
          chat: { type: 'channel' },
          chatSession: undefined,
          session: {},
        } as unknown as GrammyContext;

        await globalMiddleware.middleware()(context, next as unknown as NextFunction);

        expect(next).toHaveBeenCalledOnce();
        expect(mockHandleError).not.toHaveBeenCalled();
      });

      it('should call next when chatSession is defined but session is missing', async () => {
        const context = {
          chat: { type: 'supergroup' },
          chatSession: {},
          session: undefined,
        } as unknown as GrammyContext;

        await globalMiddleware.middleware()(context, next as unknown as NextFunction);

        expect(next).toHaveBeenCalledOnce();
      });
    });

    describe('when both chatSession and session are present', () => {
      it('should call updateChatInfo, updateChatSessionIfEmpty, and next', async () => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        const updateChatInfoSpy = vi.spyOn(globalMiddleware, 'updateChatInfo').mockResolvedValue(undefined);
        // eslint-disable-next-line no-secrets/no-secrets, unicorn/no-useless-undefined
        const updateChatSessionIfEmptySpy = vi.spyOn(globalMiddleware, 'updateChatSessionIfEmpty').mockResolvedValue(undefined);

        const context = {
          chat: { type: 'supergroup' },
          chatSession: {
            chatSettings: {
              airRaidAlertSettings: { pageNumber: 1, state: null, notificationMessage: false },
              disableChatWhileAirRaidAlert: false,
            },
          },
          session: {},
        } as unknown as GrammyContext;

        await globalMiddleware.middleware()(context, next as unknown as NextFunction);

        expect(updateChatInfoSpy).toHaveBeenCalledWith(context);
        expect(updateChatSessionIfEmptySpy).toHaveBeenCalledWith(context);
        expect(next).toHaveBeenCalledOnce();
      });
    });
  });

  describe('updateChatInfo()', () => {
    it('should set chatType and call getChatTitle with chat', async () => {
      const context = makeContext();

      await globalMiddleware.updateChatInfo(context);
      expect(context.chatSession.chatType).toBe('supergroup');
      expect(mockGetChatTitle).toHaveBeenCalledWith(context.chat);
    });

    it('should set default chatSettings when chatSettings is undefined', async () => {
      const context = makeContext({
        chatSession: { chatSettings: undefined },
      });

      await globalMiddleware.updateChatInfo(context);
      expect(context.chatSession.chatSettings).toBeDefined();
      expect(context.chatSession.chatSettings.disableChatWhileAirRaidAlert).toBe(false);
      expect(context.chatSession.chatSettings.airRaidAlertSettings).toBeDefined();
    });

    it('should set default disableChatWhileAirRaidAlert when it is undefined', async () => {
      const context = makeContext({
        chatSession: {
          chatSettings: {
            airRaidAlertSettings: { pageNumber: 1, state: null, notificationMessage: false },
            disableChatWhileAirRaidAlert: undefined,
          },
        },
      });

      await globalMiddleware.updateChatInfo(context);
      expect(context.chatSession.chatSettings.disableChatWhileAirRaidAlert).toBe(false);
    });

    it('should set default airRaidAlertSettings when it is undefined', async () => {
      const context = makeContext({
        chatSession: {
          chatSettings: {
            airRaidAlertSettings: undefined,
            disableChatWhileAirRaidAlert: false,
          },
        },
      });

      await globalMiddleware.updateChatInfo(context);
      expect(context.chatSession.chatSettings.airRaidAlertSettings).toBeDefined();
      expect(context.chatSession.chatSettings.airRaidAlertSettings.pageNumber).toBe(1);
      expect(context.chatSession.chatSettings.airRaidAlertSettings.state).toBeNull();
      expect(context.chatSession.chatSettings.airRaidAlertSettings.notificationMessage).toBe(false);
    });

    it('should call getChatMembersCount and update chatMembersCount when status is "member"', async () => {
      const getChatMembersCount = vi.fn().mockResolvedValue(42);
      const context = makeContext({ getChatMembersCount });

      await globalMiddleware.updateChatInfo(context);
      expect(getChatMembersCount).toHaveBeenCalledOnce();
      expect(context.chatSession.chatMembersCount).toBe(42);
    });

    it('should NOT call getChatMembersCount when myChatMember status is "left"', async () => {
      const getChatMembersCount = vi.fn().mockResolvedValue(0);

      const context = makeContext({
        myChatMember: { new_chat_member: { status: 'left' } },
        getChatMembersCount,
      });

      await globalMiddleware.updateChatInfo(context);
      expect(getChatMembersCount).not.toHaveBeenCalled();
    });

    it('should NOT call getChatMembersCount when myChatMember status is "kicked"', async () => {
      const getChatMembersCount = vi.fn().mockResolvedValue(0);

      const context = makeContext({
        myChatMember: { new_chat_member: { status: 'kicked' } },
        getChatMembersCount,
      });

      await globalMiddleware.updateChatInfo(context);
      expect(getChatMembersCount).not.toHaveBeenCalled();
    });

    it('should NOT call getChatMembersCount when myChatMember is undefined (defaults to "left")', async () => {
      const getChatMembersCount = vi.fn().mockResolvedValue(0);
      const context = makeContext({ myChatMember: undefined, getChatMembersCount });

      await globalMiddleware.updateChatInfo(context);
      expect(getChatMembersCount).not.toHaveBeenCalled();
    });
  });

  describe('updateChatSessionIfEmpty()', () => {
    it('should set botRemoved=false and isBotAdmin=true for private chat and return early', async () => {
      const getChat = vi.fn();

      const context = {
        chat: { type: 'private' },
        chatSession: {},
        getChat,
      } as unknown as GrammyContext;

      await globalMiddleware.updateChatSessionIfEmpty(context);

      expect(context.chatSession.botRemoved).toBe(false);
      expect(context.chatSession.isBotAdmin).toBe(true);
      expect(getChat).not.toHaveBeenCalled();
    });

    it('should NOT call getChat when botRemoved is already defined', async () => {
      const getChat = vi.fn().mockResolvedValue({});

      const context = {
        chat: { type: 'supergroup' },
        chatSession: { botRemoved: false, isBotAdmin: true },
        getChat,
        getChatAdministrators: vi.fn().mockResolvedValue([]),
        me: { id: 1 },
      } as unknown as GrammyContext;

      await globalMiddleware.updateChatSessionIfEmpty(context);

      expect(getChat).not.toHaveBeenCalled();
    });

    it('should set botRemoved=false when getChat resolves', async () => {
      const context = {
        chat: { type: 'supergroup' },
        chatSession: { botRemoved: undefined, isBotAdmin: true },
        getChat: vi.fn().mockResolvedValue({}),
        getChatAdministrators: vi.fn().mockResolvedValue([]),
        me: { id: 1 },
      } as unknown as GrammyContext;

      await globalMiddleware.updateChatSessionIfEmpty(context);

      expect(context.chatSession.botRemoved).toBe(false);
    });

    it('should set botRemoved=true when getChat rejects', async () => {
      const context = {
        chat: { type: 'supergroup' },
        chatSession: { botRemoved: undefined, isBotAdmin: true },
        getChat: vi.fn().mockRejectedValue(new Error('Not found')),
        getChatAdministrators: vi.fn().mockResolvedValue([]),
        me: { id: 1 },
      } as unknown as GrammyContext;

      await globalMiddleware.updateChatSessionIfEmpty(context);

      expect(context.chatSession.botRemoved).toBe(true);
    });

    it('should NOT call getChatAdministrators when isBotAdmin is already defined', async () => {
      const getChatAdministrators = vi.fn().mockResolvedValue([]);

      const context = {
        chat: { type: 'supergroup' },
        chatSession: { botRemoved: false, isBotAdmin: false },
        getChat: vi.fn().mockResolvedValue({}),
        getChatAdministrators,
        me: { id: 1 },
      } as unknown as GrammyContext;

      await globalMiddleware.updateChatSessionIfEmpty(context);

      expect(getChatAdministrators).not.toHaveBeenCalled();
    });

    it('should set isBotAdmin=true and botAdminDate when bot is in admin list', async () => {
      const context = {
        chat: { type: 'supergroup' },
        chatSession: { botRemoved: false, isBotAdmin: undefined },
        getChat: vi.fn().mockResolvedValue({}),
        getChatAdministrators: vi.fn().mockResolvedValue([{ user: { id: 42 } }]),
        me: { id: 42 },
      } as unknown as GrammyContext;

      await globalMiddleware.updateChatSessionIfEmpty(context);

      expect(context.chatSession.isBotAdmin).toBe(true);
      expect(context.chatSession.botAdminDate).toBeInstanceOf(Date);
    });

    it('should set isBotAdmin=false and botAdminDate=null when bot is NOT in admin list', async () => {
      const context = {
        chat: { type: 'supergroup' },
        chatSession: { botRemoved: false, isBotAdmin: undefined },
        getChat: vi.fn().mockResolvedValue({}),
        getChatAdministrators: vi.fn().mockResolvedValue([{ user: { id: 99 } }]),
        me: { id: 42 },
      } as unknown as GrammyContext;

      await globalMiddleware.updateChatSessionIfEmpty(context);

      expect(context.chatSession.isBotAdmin).toBe(false);
      expect(context.chatSession.botAdminDate).toBeNull();
    });

    it('should handle getChatAdministrators rejection gracefully', async () => {
      const context = {
        chat: { type: 'supergroup' },
        chatSession: { botRemoved: false, isBotAdmin: undefined },
        getChat: vi.fn().mockResolvedValue({}),
        getChatAdministrators: vi.fn().mockRejectedValue(new Error('Forbidden')),
        me: { id: 42 },
      } as unknown as GrammyContext;

      await expect(globalMiddleware.updateChatSessionIfEmpty(context)).resolves.toBeUndefined();
    });

    it('should handle empty admins array and set isBotAdmin=false', async () => {
      const context = {
        chat: { type: 'supergroup' },
        chatSession: { botRemoved: false, isBotAdmin: undefined },
        getChat: vi.fn().mockResolvedValue({}),
        getChatAdministrators: vi.fn().mockResolvedValue(null),
        me: { id: 42 },
      } as unknown as GrammyContext;

      await globalMiddleware.updateChatSessionIfEmpty(context);

      expect(context.chatSession.isBotAdmin).toBe(false);
    });
  });
});
