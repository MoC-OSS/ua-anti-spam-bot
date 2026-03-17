import type { NextFunction } from 'grammy';

import { ignoreOld } from '@bot/middleware/ignore-old.middleware';

import type { GrammyContext } from '@app-types/context';

vi.mock('@utils/logger.util', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe('ignoreOld', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    next = vi.fn().mockResolvedValue(undefined);
  });

  it('should call next when there is no date (no msg, no editedMessage)', () => {
    const context = {
      msg: undefined,
      editedMessage: undefined,
    } as unknown as GrammyContext;

    const mw = ignoreOld();

    mw(context, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should call next when message date is recent (10s ago)', () => {
    const recentDate = Math.floor(Date.now() / 1000) - 10;

    const context = {
      msg: { date: recentDate },
      editedMessage: undefined,
    } as unknown as GrammyContext;

    const mw = ignoreOld();

    mw(context, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should NOT call next and return undefined when message date is old (400s ago > 300s threshold)', () => {
    const oldDate = Math.floor(Date.now() / 1000) - 400;

    const context = {
      msg: { date: oldDate },
      editedMessage: undefined,
    } as unknown as GrammyContext;

    const mw = ignoreOld();
    const result = mw(context, next as unknown as NextFunction);

    expect(next).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('should use editedMessage.edit_date when present and old', () => {
    const oldDate = Math.floor(Date.now() / 1000) - 400;

    const context = {
      msg: undefined,
      editedMessage: { edit_date: oldDate },
    } as unknown as GrammyContext;

    const mw = ignoreOld();
    const result = mw(context, next as unknown as NextFunction);

    expect(next).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('should call next with custom threshold when message is old for default but recent for custom', () => {
    const date = Math.floor(Date.now() / 1000) - 400; // 400s ago, old for default (300s), recent for custom (600s)

    const context = {
      msg: { date },
      editedMessage: undefined,
    } as unknown as GrammyContext;

    const mw = ignoreOld(600);

    mw(context, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledOnce();
  });
});
