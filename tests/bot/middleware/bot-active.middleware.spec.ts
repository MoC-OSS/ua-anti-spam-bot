import type { NextFunction } from 'grammy';

import { botActiveMiddleware } from '@bot/middleware/bot-active.middleware';

import type { GrammyContext } from '@app-types/context';

const { mockLogSkipMiddleware } = vi.hoisted(() => ({
  mockLogSkipMiddleware: vi.fn(),
}));

vi.mock('@utils/generic.util', () => ({
  logSkipMiddleware: mockLogSkipMiddleware,
}));

describe('botActiveMiddleware', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    next = vi.fn().mockResolvedValue(undefined);
    mockLogSkipMiddleware.mockClear();
  });

  it('should call next when chat is supergroup, bot is not removed, and bot is admin', () => {
    const context = {
      chat: { type: 'supergroup' },
      chatSession: { botRemoved: false, isBotAdmin: true },
    } as unknown as GrammyContext;

    botActiveMiddleware(context, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledOnce();
    expect(mockLogSkipMiddleware).not.toHaveBeenCalled();
  });

  it('should call next when chat is private regardless of botRemoved/isBotAdmin', () => {
    const context = {
      chat: { type: 'private' },
      chatSession: { botRemoved: true, isBotAdmin: false },
    } as unknown as GrammyContext;

    botActiveMiddleware(context, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledOnce();
    expect(mockLogSkipMiddleware).not.toHaveBeenCalled();
  });

  it('should NOT call next and return undefined when chat is supergroup and bot is removed', () => {
    const context = {
      chat: { type: 'supergroup' },
      chatSession: { botRemoved: true, isBotAdmin: true },
    } as unknown as GrammyContext;

    const result = botActiveMiddleware(context, next as unknown as NextFunction);

    expect(next).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
    expect(mockLogSkipMiddleware).toHaveBeenCalledOnce();
  });

  it('should NOT call next and return undefined when chat is supergroup and bot is not admin', () => {
    const context = {
      chat: { type: 'supergroup' },
      chatSession: { botRemoved: false, isBotAdmin: false },
    } as unknown as GrammyContext;

    const result = botActiveMiddleware(context, next as unknown as NextFunction);

    expect(next).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
    expect(mockLogSkipMiddleware).toHaveBeenCalledOnce();
  });
});
