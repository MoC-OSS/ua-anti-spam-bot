import type { NextFunction } from 'grammy';

import { logParsedPhotosMiddleware } from '@bot/middleware/log-parsed-photos.middleware';

import type { GrammyContext } from '@app-types/context';

const { mockOnlyCreatorFilter, mockIsPrivateChat, mockInputFile, mockEnvConfig } = vi.hoisted(() => ({
  mockOnlyCreatorFilter: vi.fn().mockReturnValue(false),
  mockIsPrivateChat: vi.fn().mockReturnValue(false),
  // Regular function (not arrow) so it can be called with `new`
  mockInputFile: vi.fn(function mockInputFileFunction(this: Record<string, unknown>, frame: unknown, name: string) {
    this.frame = frame;
    this.name = name;
  }),
  mockEnvConfig: { ENV: 'test' } as Record<string, unknown>,
}));

vi.mock('@bot/filters/only-creator.filter', () => ({
  onlyCreatorFilter: mockOnlyCreatorFilter,
}));

vi.mock('grammy-guard', () => ({
  isPrivateChat: mockIsPrivateChat,
}));

vi.mock('grammy', () => ({
  InputFile: mockInputFile,
}));

vi.mock('@shared/config', () => ({
  environmentConfig: mockEnvConfig,
}));

vi.mock('@utils/logger.util', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

describe('logParsedPhotosMiddleware', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line unicorn/no-useless-undefined
    next = vi.fn().mockResolvedValue(undefined);
    mockOnlyCreatorFilter.mockReturnValue(false);
    mockIsPrivateChat.mockReturnValue(false);
    mockEnvConfig.ENV = 'test';
  });

  describe('when isValidToLog is false', () => {
    it('should call next without replyWithMediaGroup when not creator and not private chat', async () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      const replyWithMediaGroup = vi.fn().mockResolvedValue(undefined);

      const context = {
        state: { photo: { meta: { file_id: 'abc' }, fileFrames: [Buffer.from('frame')] }, isDeleted: false },
        msg: { message_id: 1 },
        replyWithMediaGroup,
      } as unknown as GrammyContext;

      await logParsedPhotosMiddleware(context, next as unknown as NextFunction);

      expect(replyWithMediaGroup).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });

    it('should NOT log when ENV is production and isPrivateChat is true (not creator)', async () => {
      mockIsPrivateChat.mockReturnValue(true);
      mockEnvConfig.ENV = 'production';
      // eslint-disable-next-line unicorn/no-useless-undefined
      const replyWithMediaGroup = vi.fn().mockResolvedValue(undefined);

      const context = {
        state: { photo: { meta: { file_id: 'xyz' }, fileFrames: [Buffer.from('frame')] }, isDeleted: false },
        msg: { message_id: 5 },
        replyWithMediaGroup,
      } as unknown as GrammyContext;

      await logParsedPhotosMiddleware(context, next as unknown as NextFunction);

      expect(replyWithMediaGroup).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('when isValidToLog is true but photo conditions are not met', () => {
    beforeEach(() => {
      mockOnlyCreatorFilter.mockReturnValue(true);
    });

    it('should call next without replyWithMediaGroup when photo is null', async () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      const replyWithMediaGroup = vi.fn().mockResolvedValue(undefined);

      const context = {
        state: { photo: null, isDeleted: false },
        replyWithMediaGroup,
      } as unknown as GrammyContext;

      await logParsedPhotosMiddleware(context, next as unknown as NextFunction);

      expect(replyWithMediaGroup).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });

    it('should call next without replyWithMediaGroup when photo has no fileFrames key', async () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      const replyWithMediaGroup = vi.fn().mockResolvedValue(undefined);

      const context = {
        state: { photo: { meta: { file_id: 'abc' } }, isDeleted: false },
        replyWithMediaGroup,
      } as unknown as GrammyContext;

      await logParsedPhotosMiddleware(context, next as unknown as NextFunction);

      expect(replyWithMediaGroup).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });

    it('should call next without replyWithMediaGroup when photo.fileFrames is null (falsy)', async () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      const replyWithMediaGroup = vi.fn().mockResolvedValue(undefined);

      const context = {
        state: { photo: { meta: { file_id: 'abc' }, fileFrames: null }, isDeleted: false },
        replyWithMediaGroup,
      } as unknown as GrammyContext;

      await logParsedPhotosMiddleware(context, next as unknown as NextFunction);

      expect(replyWithMediaGroup).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('when isValidToLog is true and photo has fileFrames', () => {
    it('should call replyWithMediaGroup when valid via onlyCreatorFilter', async () => {
      mockOnlyCreatorFilter.mockReturnValue(true);
      // eslint-disable-next-line unicorn/no-useless-undefined
      const replyWithMediaGroup = vi.fn().mockResolvedValue(undefined);
      const frame = Buffer.from('frame1');

      const context = {
        state: {
          photo: { meta: { file_id: 'abc123' }, fileFrames: [frame] },
          isDeleted: false,
        },
        msg: { message_id: 999 },
        replyWithMediaGroup,
      } as unknown as GrammyContext;

      await logParsedPhotosMiddleware(context, next as unknown as NextFunction);

      expect(replyWithMediaGroup).toHaveBeenCalledExactlyOnceWith(
        expect.arrayContaining([expect.objectContaining({ type: 'photo', caption: 'Parsed photo gallery screenshots' })]),
        { reply_to_message_id: 999 },
      );

      expect(next).toHaveBeenCalledOnce();
    });

    it('should call replyWithMediaGroup when valid via isPrivateChat and non-production ENV', async () => {
      mockIsPrivateChat.mockReturnValue(true);
      mockEnvConfig.ENV = 'development';
      // eslint-disable-next-line unicorn/no-useless-undefined
      const replyWithMediaGroup = vi.fn().mockResolvedValue(undefined);
      const frame = Buffer.from('frame');

      const context = {
        state: {
          photo: { meta: { file_id: 'xyz' }, fileFrames: [frame] },
          isDeleted: false,
        },
        msg: { message_id: 1 },
        replyWithMediaGroup,
      } as unknown as GrammyContext;

      await logParsedPhotosMiddleware(context, next as unknown as NextFunction);

      expect(replyWithMediaGroup).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledOnce();
    });

    it('should pass reply_to_message_id=undefined when isDeleted=true', async () => {
      mockOnlyCreatorFilter.mockReturnValue(true);
      // eslint-disable-next-line unicorn/no-useless-undefined
      const replyWithMediaGroup = vi.fn().mockResolvedValue(undefined);
      const frame = Buffer.from('frame');

      const context = {
        state: {
          photo: { meta: { file_id: 'abc' }, fileFrames: [frame] },
          isDeleted: true,
        },
        msg: { message_id: 100 },
        replyWithMediaGroup,
      } as unknown as GrammyContext;

      await logParsedPhotosMiddleware(context, next as unknown as NextFunction);

      expect(replyWithMediaGroup).toHaveBeenCalledWith(expect.any(Array), { reply_to_message_id: undefined });
    });

    it('should pass reply_to_message_id from context.msg when isDeleted=false', async () => {
      mockOnlyCreatorFilter.mockReturnValue(true);
      // eslint-disable-next-line unicorn/no-useless-undefined
      const replyWithMediaGroup = vi.fn().mockResolvedValue(undefined);
      const frame = Buffer.from('frame');

      const context = {
        state: {
          photo: { meta: { file_id: 'abc' }, fileFrames: [frame] },
          isDeleted: false,
        },
        msg: { message_id: 456 },
        replyWithMediaGroup,
      } as unknown as GrammyContext;

      await logParsedPhotosMiddleware(context, next as unknown as NextFunction);

      expect(replyWithMediaGroup).toHaveBeenCalledWith(expect.any(Array), { reply_to_message_id: 456 });
    });

    it('should create one InputFile per frame with correct filename', async () => {
      mockOnlyCreatorFilter.mockReturnValue(true);
      // eslint-disable-next-line unicorn/no-useless-undefined
      const replyWithMediaGroup = vi.fn().mockResolvedValue(undefined);
      const frames = [Buffer.from('f1'), Buffer.from('f2')];

      const context = {
        state: {
          photo: { meta: { file_id: 'id42' }, fileFrames: frames },
          isDeleted: false,
        },
        msg: { message_id: 1 },
        replyWithMediaGroup,
      } as unknown as GrammyContext;

      await logParsedPhotosMiddleware(context, next as unknown as NextFunction);

      expect(mockInputFile).toHaveBeenCalledTimes(2);
      expect(mockInputFile).toHaveBeenNthCalledWith(1, frames[0], 'id420.png');
      expect(mockInputFile).toHaveBeenNthCalledWith(2, frames[1], 'id421.png');
    });
  });
});
