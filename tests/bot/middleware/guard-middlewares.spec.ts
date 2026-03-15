import type { NextFunction } from 'grammy';

import { deleteMessageMiddleware } from '@bot/middleware/delete-message.middleware';
import { ignoreByDefaultSettingsMiddleware } from '@bot/middleware/ignore-by-default-settings.middleware';
import { onlyNotForwarded } from '@bot/middleware/only-not-forwarded.middleware';
import { onlyWhenBotAdmin } from '@bot/middleware/only-when-bot-admin.middleware';

import type { GrammyContext } from '@app-types/context';

const { mockLogSkipMiddleware } = vi.hoisted(() => ({
  mockLogSkipMiddleware: vi.fn(),
}));

vi.mock('@utils/generic.util', () => ({
  logSkipMiddleware: mockLogSkipMiddleware,
}));

describe('onlyNotForwarded', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    next = vi.fn().mockResolvedValue(undefined);
    mockLogSkipMiddleware.mockClear();
  });

  it('should call next when message has no forward_origin', () => {
    const context = {
      update: { message: {} },
    } as unknown as GrammyContext;

    onlyNotForwarded(context, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledOnce();
    expect(mockLogSkipMiddleware).not.toHaveBeenCalled();
  });

  it('should NOT call next and return undefined when message has forward_origin', () => {
    const context = {
      update: { message: { forward_origin: { type: 'user' } } },
    } as unknown as GrammyContext;

    const result = onlyNotForwarded(context, next as unknown as NextFunction);

    expect(next).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
    expect(mockLogSkipMiddleware).toHaveBeenCalledOnce();
  });
});

describe('onlyWhenBotAdmin', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    next = vi.fn().mockResolvedValue(undefined);
    mockLogSkipMiddleware.mockClear();
  });

  it('should call next when chat is private', () => {
    const context = {
      chat: { type: 'private' },
      msg: { date: Math.floor(Date.now() / 1000) },
      chatSession: { isBotAdmin: false, botRemoved: true, botAdminDate: null },
    } as unknown as GrammyContext;

    onlyWhenBotAdmin(context, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledOnce();
    expect(mockLogSkipMiddleware).not.toHaveBeenCalled();
  });

  it('should call next when chat is supergroup, bot is admin, and message is after botAdminDate', () => {
    const context = {
      chat: { type: 'supergroup' },
      msg: { date: Math.floor(Date.now() / 1000) },
      chatSession: {
        isBotAdmin: true,
        botRemoved: false,
        botAdminDate: new Date(0),
      },
    } as unknown as GrammyContext;

    onlyWhenBotAdmin(context, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledOnce();
    expect(mockLogSkipMiddleware).not.toHaveBeenCalled();
  });

  it('should NOT call next when chat is supergroup and botRemoved is true', () => {
    const context = {
      chat: { type: 'supergroup' },
      msg: { date: Math.floor(Date.now() / 1000) },
      chatSession: {
        isBotAdmin: true,
        botRemoved: true,
        botAdminDate: new Date(0),
      },
    } as unknown as GrammyContext;

    const result = onlyWhenBotAdmin(context, next as unknown as NextFunction);

    expect(next).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
    expect(mockLogSkipMiddleware).toHaveBeenCalledOnce();
  });

  it('should NOT call next when chat is supergroup and isBotAdmin is false', () => {
    const context = {
      chat: { type: 'supergroup' },
      msg: { date: Math.floor(Date.now() / 1000) },
      chatSession: {
        isBotAdmin: false,
        botRemoved: false,
        botAdminDate: new Date(0),
      },
    } as unknown as GrammyContext;

    const result = onlyWhenBotAdmin(context, next as unknown as NextFunction);

    expect(next).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
    expect(mockLogSkipMiddleware).toHaveBeenCalledOnce();
  });
});

// eslint-disable-next-line no-secrets/no-secrets
describe('ignoreByDefaultSettingsMiddleware', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    next = vi.fn().mockResolvedValue(undefined);
  });

  it('should call next when setting is false', async () => {
    const context = {
      chatSession: { chatSettings: { disableSwindlerMessage: false } },
    } as unknown as GrammyContext;

    const mw = ignoreByDefaultSettingsMiddleware('disableSwindlerMessage');

    await mw(context, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should NOT call next when setting is true', async () => {
    const context = {
      chatSession: { chatSettings: { disableSwindlerMessage: true } },
    } as unknown as GrammyContext;

    const mw = ignoreByDefaultSettingsMiddleware('disableSwindlerMessage');

    await mw(context, next as unknown as NextFunction);

    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when setting is undefined', async () => {
    const context = {
      chatSession: { chatSettings: {} },
    } as unknown as GrammyContext;

    const mw = ignoreByDefaultSettingsMiddleware('disableSwindlerMessage');

    await mw(context, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledOnce();
  });
});

describe('deleteMessageMiddleware', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    next = vi.fn().mockResolvedValue(undefined);
  });

  it('should call deleteMessage and then next when isBotAdmin is true and deleteMessage succeeds', async () => {
    const context = {
      chatSession: { isBotAdmin: true },
      deleteMessage: vi.fn().mockResolvedValue(true),
      reply: vi.fn().mockResolvedValue({}),
    } as unknown as GrammyContext;

    const mw = deleteMessageMiddleware('reason');

    await mw(context, next as unknown as NextFunction);

    expect(context.deleteMessage).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
    expect(context.reply).not.toHaveBeenCalled();
  });

  it('should call reply with reason when isBotAdmin is true and deleteMessage fails', async () => {
    const context = {
      chatSession: { isBotAdmin: true },
      deleteMessage: vi.fn().mockRejectedValue(new Error('cannot delete')),
      reply: vi.fn().mockResolvedValue({}),
    } as unknown as GrammyContext;

    const mw = deleteMessageMiddleware('reason text');

    await mw(context, next as unknown as NextFunction);

    expect(context.deleteMessage).toHaveBeenCalledOnce();
    expect(context.reply).toHaveBeenCalledWith('reason text', { parse_mode: 'HTML' });
  });

  it('should NOT call reply when isBotAdmin is true, deleteMessage fails, and reason is empty', async () => {
    const context = {
      chatSession: { isBotAdmin: true },
      deleteMessage: vi.fn().mockRejectedValue(new Error('cannot delete')),
      reply: vi.fn().mockResolvedValue({}),
    } as unknown as GrammyContext;

    const mw = deleteMessageMiddleware('');

    await mw(context, next as unknown as NextFunction);

    expect(context.deleteMessage).toHaveBeenCalledOnce();
    expect(context.reply).not.toHaveBeenCalled();
  });

  it('should call reply with reason and NOT call deleteMessage when isBotAdmin is false', async () => {
    const context = {
      chatSession: { isBotAdmin: false },
      deleteMessage: vi.fn(),
      reply: vi.fn().mockResolvedValue({}),
    } as unknown as GrammyContext;

    const mw = deleteMessageMiddleware('reason text');

    await mw(context, next as unknown as NextFunction);

    expect(context.deleteMessage).not.toHaveBeenCalled();
    expect(context.reply).toHaveBeenCalledWith('reason text', { parse_mode: 'HTML' });
    expect(next).not.toHaveBeenCalled();
  });
});
