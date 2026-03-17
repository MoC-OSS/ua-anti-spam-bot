import type { Bot } from 'grammy';

import axios from 'axios';

import { DeleteSwindlersMiddleware } from '@bot/middleware/delete-swindlers.middleware';

import type { SwindlersDetectService } from '@services/swindlers-detect.service';

import { environmentConfig } from '@shared/config';

import type { GrammyContext } from '@app-types/context';
import type { SwindlersResult } from '@app-types/swindlers';

import { compareDatesWithOffset } from '@utils/date-format.util';
import { telegramUtility } from '@utils/util-instances.util';

vi.mock('axios');

vi.mock('@bot/creator', () => ({
  logsChat: -1_001_111_111_111,
  secondLogsChat: -1_002_222_222_222,
}));

vi.mock('@shared/config', () => ({
  environmentConfig: {
    USE_SERVER: false,
    HOST: 'localhost',
    PORT: '3000',
    DEBUG: false,
    ENV: 'test',
  },
}));

vi.mock('@utils/logger.util', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

vi.mock('@const/logs.const', () => ({
  LOGS_CHAT_THREAD_IDS: { SWINDLERS: 1, STRATEGIC: 2 },
  SECOND_LOGS_CHAT_THREAD_IDS: { SWINDLERS: 3 },
}));

vi.mock('@utils/reveal-hidden-urls.util', () => ({
  revealHiddenUrls: vi.fn((context: any) => context.msg?.text || ''),
}));

vi.mock('@utils/error-handler.util', () => ({
  handleError: vi.fn(),
}));

vi.mock('@utils/util-instances.util', () => ({
  telegramUtility: {
    getChatAdmins: vi.fn().mockResolvedValue({ adminsString: '@admin1' }),
    getChatTitle: vi.fn().mockReturnValue('Test Chat'),
    getLogsSaveMessageParts: vi.fn().mockResolvedValue({ userMention: '@user', chatMention: 'Chat' }),
  },
}));

vi.mock('@utils/date-format.util', () => ({
  compareDatesWithOffset: vi.fn().mockReturnValue(true),
}));

vi.mock('@message', () => ({
  cannotDeleteMessage: 'cannot-delete',
  getCannotDeleteMessage: vi.fn().mockReturnValue('cannot-delete-message'),
  swindlerLogsStartMessage: 'swindler-logs',
}));

vi.mock('@message/swindlers.message', () => ({
  getSwindlersWarningMessage: vi.fn().mockReturnValue('warning-message'),
}));

const NOT_SPAM: SwindlersResult = { isSpam: false, rate: 0, reason: 'no match', results: {} as any };
const SPAM: SwindlersResult = { isSpam: true, rate: 0.9, reason: 'tensor', results: {} as any };
const COMPARE_NOT_SPAM: SwindlersResult = { isSpam: false, rate: 0.85, reason: 'compare', results: {} as any };

const createMockContext = (overrides?: Partial<GrammyContext>): GrammyContext => {
  const chatSession: any = {
    chatSettings: {
      disableDeleteMessage: false,
    },
    isLimitedDeletion: false,
    lastLimitedDeletionDate: new Date(0),
    lastWarningDate: undefined,
  };

  return {
    msg: { message_id: 1, text: 'test message', from: { id: 12_345, first_name: 'Test' } },
    chat: { id: -1_001_234_567_890, type: 'supergroup', title: 'Test Chat' },
    from: { id: 12_345, first_name: 'Test' },
    state: { text: 'test message' },
    chatSession,
    deleteMessage: vi.fn().mockResolvedValue(true),
    reply: vi.fn().mockResolvedValue({ message_id: 2 }),
    // eslint-disable-next-line unicorn/no-useless-undefined
    replyWithSelfDestructedHTML: vi.fn().mockResolvedValue(undefined),
    api: {
      sendMessage: vi.fn().mockResolvedValue({ message_id: 3 }),
      // eslint-disable-next-line unicorn/no-useless-undefined
      sendDocument: vi.fn().mockResolvedValue(undefined),
      getChatAdministrators: vi.fn().mockResolvedValue([]),
    },
    t: vi.fn((key: string) => key),
    getChat: vi.fn().mockResolvedValue({ id: -1_001_234_567_890, type: 'supergroup', title: 'Test Chat' }),
    ...overrides,
  } as unknown as GrammyContext;
};

describe('DeleteSwindlersMiddleware', () => {
  let middlewareInstance: DeleteSwindlersMiddleware;
  let mockSwindlersDetectService: SwindlersDetectService;
  let mockBot: Bot<GrammyContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-establish defaults that individual tests may override
    vi.mocked(compareDatesWithOffset).mockReturnValue(true);
    vi.mocked(telegramUtility.getChatAdmins).mockResolvedValue({ adminsString: '@admin1' } as any);
    vi.mocked(telegramUtility.getLogsSaveMessageParts).mockResolvedValue({ userMention: '@user', chatMention: 'Chat' } as any);

    mockSwindlersDetectService = {
      isSwindlerMessage: vi.fn().mockResolvedValue(NOT_SPAM),
    } as unknown as SwindlersDetectService;

    mockBot = {
      api: {
        sendMessage: vi.fn().mockResolvedValue({ message_id: 3 }),
        // eslint-disable-next-line unicorn/no-useless-undefined
        sendDocument: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as Bot<GrammyContext>;

    middlewareInstance = new DeleteSwindlersMiddleware(mockBot, mockSwindlersDetectService);
    (environmentConfig as any).USE_SERVER = false;
  });

  describe('checkMessage', () => {
    it('calls swindlersDetectService.isSwindlerMessage when USE_SERVER=false', async () => {
      const result = await middlewareInstance.checkMessage('test message');

      expect(mockSwindlersDetectService.isSwindlerMessage).toHaveBeenCalledWith('test message');
      expect(result).toEqual(NOT_SPAM);
    });

    it('calls axios.post when USE_SERVER=true', async () => {
      (environmentConfig as any).USE_SERVER = true;
      vi.mocked(axios.post).mockResolvedValue({ data: { result: SPAM } } as any);

      const result = await middlewareInstance.checkMessage('test message');

      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/swindlers'), { message: 'test message' });
      expect(result).toEqual(SPAM);
      expect(mockSwindlersDetectService.isSwindlerMessage).not.toHaveBeenCalled();
    });

    it('falls back to swindlersDetectService when axios throws', async () => {
      (environmentConfig as any).USE_SERVER = true;
      vi.mocked(axios.post).mockRejectedValue(new Error('network error'));

      const result = await middlewareInstance.checkMessage('test message');

      expect(mockSwindlersDetectService.isSwindlerMessage).toHaveBeenCalledWith('test message');
      expect(result).toEqual(NOT_SPAM);
    });
  });

  describe('middleware()', () => {
    it('calls saveSwindlersMessage + processWarningMessage + removeMessage when isSpam=true', async () => {
      const context = createMockContext();
      // eslint-disable-next-line unicorn/no-useless-undefined
      const next = vi.fn().mockResolvedValue(undefined);

      vi.spyOn(middlewareInstance, 'checkMessage').mockResolvedValue(SPAM);
      const saveSpy = vi.spyOn(middlewareInstance, 'saveSwindlersMessage').mockResolvedValue(undefined as any);
      const warnSpy = vi.spyOn(middlewareInstance, 'processWarningMessage').mockReturnValue(undefined as any);
      const removeSpy = vi.spyOn(middlewareInstance, 'removeMessage').mockResolvedValue(undefined as any);

      await middlewareInstance.middleware()(context, next);

      expect(saveSpy).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(removeSpy).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledOnce();
    });

    it('calls saveSwindlersMessage but skips removeMessage when isSpam=false && reason=compare', async () => {
      const context = createMockContext();
      // eslint-disable-next-line unicorn/no-useless-undefined
      const next = vi.fn().mockResolvedValue(undefined);

      vi.spyOn(middlewareInstance, 'checkMessage').mockResolvedValue(COMPARE_NOT_SPAM);
      const saveSpy = vi.spyOn(middlewareInstance, 'saveSwindlersMessage').mockResolvedValue(undefined as any);
      const removeSpy = vi.spyOn(middlewareInstance, 'removeMessage').mockResolvedValue(undefined as any);

      await middlewareInstance.middleware()(context, next);

      expect(saveSpy).toHaveBeenCalledOnce();
      expect(removeSpy).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });

    it('only calls next when not spam and reason is not compare', async () => {
      const context = createMockContext();
      // eslint-disable-next-line unicorn/no-useless-undefined
      const next = vi.fn().mockResolvedValue(undefined);

      vi.spyOn(middlewareInstance, 'checkMessage').mockResolvedValue(NOT_SPAM);
      const saveSpy = vi.spyOn(middlewareInstance, 'saveSwindlersMessage').mockResolvedValue(undefined as any);

      await middlewareInstance.middleware()(context, next);

      expect(saveSpy).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('processWarningMessage', () => {
    it('sends warning reply when lastWarningDate is not set', () => {
      const context = createMockContext();

      context.chatSession.lastWarningDate = undefined;

      middlewareInstance.processWarningMessage(context);

      expect(context.reply).toHaveBeenCalledWith('warning-message', { parse_mode: 'HTML' });
    });

    it('does not send warning when user was warned recently', () => {
      const context = createMockContext();

      // Set to current time — delay of 3 days has not elapsed
      context.chatSession.lastWarningDate = new Date();

      const result = middlewareInstance.processWarningMessage(context);

      expect(result).toBeUndefined();
      expect(context.reply).not.toHaveBeenCalled();
    });
  });

  describe('removeMessage', () => {
    it('does not call getChatAdmins when deleteMessage succeeds', async () => {
      const context = createMockContext();

      await middlewareInstance.removeMessage(context);

      expect(telegramUtility.getChatAdmins).not.toHaveBeenCalled();
    });

    it('calls getChatAdmins and reply when deleteMessage fails and isLimitedDeletion=false', async () => {
      const context = createMockContext();

      (context.deleteMessage as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('forbidden'));
      context.chatSession.isLimitedDeletion = false;

      await middlewareInstance.removeMessage(context);

      expect(telegramUtility.getChatAdmins).toHaveBeenCalledWith(context, context.chat?.id);
    });

    it('skips getChatAdmins when isLimitedDeletion=true and compareDatesWithOffset returns false', async () => {
      const context = createMockContext();

      (context.deleteMessage as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('forbidden'));
      context.chatSession.isLimitedDeletion = true;
      vi.mocked(compareDatesWithOffset).mockReturnValue(false);

      await middlewareInstance.removeMessage(context);

      expect(telegramUtility.getChatAdmins).not.toHaveBeenCalled();
    });
  });
});
