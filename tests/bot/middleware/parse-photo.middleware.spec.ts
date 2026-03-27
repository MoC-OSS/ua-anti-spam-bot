import type { NextFunction } from 'grammy';

import axios from 'axios';

import { parsePhoto } from '@bot/middleware/parse-photo.middleware';

import type { GrammyContext } from '@app-types/context';
import { ImageType } from '@app-types/image';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('sharp', () => ({
  default: vi.fn().mockImplementation(() => ({
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('test-jpeg')),
  })),
}));

vi.mock('@shared/config', () => ({
  environmentConfig: {
    BOT_TOKEN: 'test-token',
    DEBUG: false,
  },
}));

const createMockContext = (messageOverrides?: Record<string, unknown>, statePhoto?: unknown) => {
  const state: Record<string, unknown> = {};

  if (statePhoto !== undefined) {
    state['photo'] = statePhoto;
  }

  return {
    state,
    msg: messageOverrides ?? {},
    api: {
      getFile: vi.fn().mockResolvedValue({ file_id: 'test-file-id', file_path: 'test/path.jpg' }),
    },
  } as unknown as GrammyContext;
};

describe('parsePhoto middleware', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    next = vi.fn().mockResolvedValue(undefined);
    vi.mocked(axios.get).mockClear();
    vi.mocked(axios.get).mockResolvedValue({ data: Buffer.from('fake-image-data') });
  });

  describe('state.photo pre-set cases', () => {
    it('should skip processing and call next() when state.photo is already a truthy value', async () => {
      const context = createMockContext({}, { meta: {}, type: ImageType.PHOTO });

      await parsePhoto(context, next as unknown as NextFunction);

      expect(next).toHaveBeenCalledOnce();
      expect(context.api.getFile).not.toHaveBeenCalled();
    });

    it('should skip processing and call next() when state.photo is null', async () => {
      const context = createMockContext({}, null);

      await parsePhoto(context, next as unknown as NextFunction);

      expect(next).toHaveBeenCalledOnce();
      expect(context.api.getFile).not.toHaveBeenCalled();
    });
  });

  describe('imageType determination', () => {
    it('should set imageType=PHOTO when photo[2] exists', async () => {
      const context = createMockContext({
        photo: [
          { file_id: 'small', file_unique_id: 'x1', width: 100, height: 100, file_size: 100 },
          { file_id: 'medium', file_unique_id: 'x2', width: 200, height: 200, file_size: 200 },
          { file_id: 'large', file_unique_id: 'x3', width: 800, height: 600, file_size: 1000 },
        ],
      });

      await parsePhoto(context, next as unknown as NextFunction);

      expect((context.state.photo as any).type).toBe(ImageType.PHOTO);
      expect((context.state.photo as any).meta).toMatchObject({ file_id: 'large' });
      expect(next).toHaveBeenCalledOnce();
    });

    it('should set imageType=STICKER for a regular sticker (is_video=false, is_animated=false)', async () => {
      const context = createMockContext({
        sticker: { file_id: 'sticker-id', file_unique_id: 'sx1', width: 512, height: 512, is_video: false, is_animated: false },
      });

      await parsePhoto(context, next as unknown as NextFunction);

      expect((context.state.photo as any).type).toBe(ImageType.STICKER);
      expect((context.state.photo as any).meta).toMatchObject({ file_id: 'sticker-id' });
      expect(next).toHaveBeenCalledOnce();
    });

    // eslint-disable-next-line no-secrets/no-secrets
    it('should set imageType=VIDEO_STICKER for a video sticker (is_video=true, is_animated=false)', async () => {
      const thumbnail = { file_id: 'thumb-id', file_unique_id: 'tx1', width: 100, height: 100 };

      const context = createMockContext({
        sticker: {
          file_id: 'vsticker-id',
          file_unique_id: 'vsx1',
          width: 512,
          height: 512,
          is_video: true,
          is_animated: false,
          thumbnail,
        },
      });

      await parsePhoto(context, next as unknown as NextFunction);

      expect((context.state.photo as any).type).toBe(ImageType.VIDEO_STICKER);
      expect((context.state.photo as any).thumb).toEqual(thumbnail);
      // getFile should be called with the thumbnail's file_id
      expect(context.api.getFile).toHaveBeenCalledWith('thumb-id');
      expect(next).toHaveBeenCalledOnce();
    });

    it('should set imageType=VIDEO when video with thumbnail is present', async () => {
      const context = createMockContext({
        video: {
          file_id: 'video-id',
          file_unique_id: 'vid1',
          width: 1280,
          height: 720,
          duration: 10,
          thumbnail: { file_id: 'vthumb-id', file_unique_id: 'vt1', width: 320, height: 180 },
        },
      });

      await parsePhoto(context, next as unknown as NextFunction);

      expect((context.state.photo as any).type).toBe(ImageType.VIDEO);
      expect(next).toHaveBeenCalledOnce();
    });

    it('should set imageType=ANIMATION when animation with thumbnail is present', async () => {
      const context = createMockContext({
        animation: {
          file_id: 'anim-id',
          file_unique_id: 'an1',
          width: 320,
          height: 200,
          duration: 3,
          thumbnail: { file_id: 'athumb-id', file_unique_id: 'at1', width: 100, height: 60 },
        },
      });

      await parsePhoto(context, next as unknown as NextFunction);

      expect((context.state.photo as any).type).toBe(ImageType.ANIMATION);
      expect(next).toHaveBeenCalledOnce();
    });

    it('should set imageType=ANIMATION when animation exists but has no thumbnail (imageMeta=null)', async () => {
      const context = createMockContext({
        animation: { file_id: 'anim-id', file_unique_id: 'an1', width: 320, height: 200, duration: 3 },
      });

      await parsePhoto(context, next as unknown as NextFunction);

      expect((context.state.photo as any).type).toBe(ImageType.ANIMATION);
      expect((context.state.photo as any).file).toBeNull();
      expect(context.api.getFile).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });

    it('should set imageType=VIDEO_NOTE when videoNote with thumbnail is present', async () => {
      const context = createMockContext({
        video_note: {
          file_id: 'vnote-id',
          file_unique_id: 'vn1',
          length: 240,
          duration: 5,
          thumbnail: { file_id: 'vnthumb-id', file_unique_id: 'vnt1', width: 240, height: 240 },
        },
      });

      await parsePhoto(context, next as unknown as NextFunction);

      expect((context.state.photo as any).type).toBe(ImageType.VIDEO_NOTE);
      expect(next).toHaveBeenCalledOnce();
    });

    it('should set imageType=VIDEO_NOTE when videoNote has no thumbnail (imageMeta=null)', async () => {
      const context = createMockContext({
        video_note: { file_id: 'vnote-id', file_unique_id: 'vn1', length: 240, duration: 5 },
      });

      await parsePhoto(context, next as unknown as NextFunction);

      expect((context.state.photo as any).type).toBe(ImageType.VIDEO_NOTE);
      expect((context.state.photo as any).file).toBeNull();
      expect(context.api.getFile).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });

    it('should set imageType=UNKNOWN and file=null when no media is present', async () => {
      const context = createMockContext({});

      await parsePhoto(context, next as unknown as NextFunction);

      expect((context.state.photo as any).type).toBe(ImageType.UNKNOWN);
      expect((context.state.photo as any).file).toBeNull();
      expect(context.api.getFile).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('file download behavior', () => {
    it('should call getFile and axios.get when imageMeta is present and file_path is returned', async () => {
      const context = createMockContext({
        photo: [
          { file_id: 'small', file_unique_id: 'x1', width: 100, height: 100, file_size: 100 },
          { file_id: 'medium', file_unique_id: 'x2', width: 200, height: 200, file_size: 200 },
          { file_id: 'large', file_unique_id: 'x3', width: 800, height: 600, file_size: 1000 },
        ],
      });

      await parsePhoto(context, next as unknown as NextFunction);

      expect(context.api.getFile).toHaveBeenCalledWith('large');

      expect(axios.get).toHaveBeenCalledWith('https://api.telegram.org/file/bottest-token/test/path.jpg', {
        responseType: 'arraybuffer',
      });

      expect((context.state.photo as any).file).toEqual(Buffer.from('test-jpeg'));
      expect(next).toHaveBeenCalledOnce();
    });

    it('should set file=null when getFile returns no file_path', async () => {
      const context = createMockContext({
        photo: [
          { file_id: 'small', file_unique_id: 'x1', width: 100, height: 100, file_size: 100 },
          { file_id: 'medium', file_unique_id: 'x2', width: 200, height: 200, file_size: 200 },
          { file_id: 'large', file_unique_id: 'x3', width: 800, height: 600, file_size: 1000 },
        ],
      });

      (context.api.getFile as ReturnType<typeof vi.fn>).mockResolvedValue({ file_id: 'large', file_path: undefined });

      await parsePhoto(context, next as unknown as NextFunction);

      expect(context.api.getFile).toHaveBeenCalledWith('large');
      expect(axios.get).not.toHaveBeenCalled();
      expect((context.state.photo as any).file).toBeNull();
      expect(next).toHaveBeenCalledOnce();
    });

    it('should use videoStickerMeta thumbnail file_id when video sticker has a thumbnail', async () => {
      const context = createMockContext({
        sticker: {
          file_id: 'vsticker-id',
          file_unique_id: 'vsx1',
          width: 512,
          height: 512,
          is_video: true,
          is_animated: false,
          thumbnail: { file_id: 'vsticker-thumb-id', file_unique_id: 'vst1', width: 100, height: 100 },
        },
      });

      await parsePhoto(context, next as unknown as NextFunction);

      // Should use thumbnail file_id, not the sticker's own file_id
      expect(context.api.getFile).toHaveBeenCalledWith('vsticker-thumb-id');
      expect(next).toHaveBeenCalledOnce();
    });

    it('should skip download and set file=null when video sticker has no thumbnail', async () => {
      const context = createMockContext({
        sticker: {
          file_id: 'vsticker-id',
          file_unique_id: 'vsx1',
          width: 512,
          height: 512,
          is_video: true,
          is_animated: false,
        },
      });

      await parsePhoto(context, next as unknown as NextFunction);

      // No thumbnail → no download → no Sharp call → file is null (avoids "unsupported image format" crash)
      expect(context.api.getFile).not.toHaveBeenCalled();
      expect((context.state.photo as any).file).toBeNull();
      expect((context.state.photo as any).type).toBe(ImageType.VIDEO_STICKER);
      // meta should still be the Sticker object for getVideoMeta to work
      expect((context.state.photo as any).meta).toMatchObject({ file_id: 'vsticker-id' });
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('state.photo contents', () => {
    it('should populate caption and animation on state.photo for animation messages', async () => {
      const animationObject = {
        file_id: 'anim-id',
        file_unique_id: 'an1',
        width: 320,
        height: 200,
        duration: 3,
        thumbnail: { file_id: 'athumb-id', file_unique_id: 'at1', width: 100, height: 60 },
      };

      const context = createMockContext({
        animation: animationObject,
        caption: 'test caption',
      });

      await parsePhoto(context, next as unknown as NextFunction);

      expect((context.state.photo as any).animation).toEqual(animationObject);
      expect((context.state.photo as any).caption).toBe('test caption');
    });

    it('should populate video and videoNote on state.photo for video_note messages', async () => {
      const videoNoteObject = {
        file_id: 'vnote-id',
        file_unique_id: 'vn1',
        length: 240,
        duration: 5,
        thumbnail: { file_id: 'vnthumb-id', file_unique_id: 'vnt1', width: 240, height: 240 },
      };

      const context = createMockContext({ video_note: videoNoteObject });

      await parsePhoto(context, next as unknown as NextFunction);

      expect((context.state.photo as any).videoNote).toEqual(videoNoteObject);
    });
  });
});
