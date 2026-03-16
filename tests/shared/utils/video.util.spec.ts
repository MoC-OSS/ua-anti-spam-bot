import axios from 'axios';

import { ImageType } from '@shared/types/image';
import { VideoUtility } from '@shared/utils/video.util';

vi.mock('axios');

vi.mock('@shared/config', () => ({
  environmentConfig: {
    BOT_TOKEN: 'test-bot-token',
  },
}));

const mockedAxiosGet = vi.mocked(axios.get);

/**
 *
 * @param filePath
 */
function buildMockApi(filePath?: string) {
  return {
    getFile: vi.fn().mockResolvedValue({
      file_path: filePath,
      file_id: 'file-id-123',
    }),
  };
}

/**
 *
 * @param type
 * @param meta
 */
function buildVideoContext(type: string, meta: Record<string, unknown>) {
  return {
    state: {
      photo: { type, ...meta },
    },
  } as any;
}

describe('VideoUtility', () => {
  let utility: VideoUtility;
  let mockApi: ReturnType<typeof buildMockApi>;

  beforeEach(() => {
    vi.resetAllMocks();
    utility = new VideoUtility();
    mockApi = buildMockApi('path/to/video.mp4');
    utility.init(mockApi as any);
    mockedAxiosGet.mockResolvedValue({ data: Buffer.from('video-data') } as any);
  });

  describe('init', () => {
    describe('positive cases', () => {
      it('should set the api property', () => {
        const api = buildMockApi();

        utility.init(api as any);

        // isContextWithVideo calls api.getFile indirectly via getVideo; just verify init does not throw
        expect(() => utility.init(api as any)).not.toThrow();
      });
    });
  });

  describe('isContextWithVideo', () => {
    describe('positive cases', () => {
      it('should return true for VIDEO type', () => {
        const context = buildVideoContext(ImageType.VIDEO, {});

        expect(utility.isContextWithVideo(context)).toBe(true);
      });

      it('should return true for VIDEO_STICKER type', () => {
        const context = buildVideoContext(ImageType.VIDEO_STICKER, {});

        expect(utility.isContextWithVideo(context)).toBe(true);
      });

      it('should return true for ANIMATION type', () => {
        const context = buildVideoContext(ImageType.ANIMATION, {});

        expect(utility.isContextWithVideo(context)).toBe(true);
      });

      it('should return true for VIDEO_NOTE type', () => {
        const context = buildVideoContext(ImageType.VIDEO_NOTE, {});

        expect(utility.isContextWithVideo(context)).toBe(true);
      });
    });

    describe('negative cases', () => {
      it('should return false for PHOTO type', () => {
        const context = buildVideoContext(ImageType.PHOTO, {});

        expect(utility.isContextWithVideo(context)).toBe(false);
      });

      it('should return false when state.photo is undefined', () => {
        const context = { state: { photo: undefined } } as any;

        expect(utility.isContextWithVideo(context)).toBe(false);
      });
    });
  });

  describe('getVideoMeta', () => {
    describe('positive cases', () => {
      it('should return video and fileName for VIDEO type', () => {
        const video = { file_id: 'vid1', file_unique_id: 'uid1', file_name: 'clip.mp4', width: 0, height: 0, duration: 0 };

        const context = {
          state: {
            photo: {
              type: ImageType.VIDEO,
              video,
              meta: {},
            },
          },
        } as any;

        const result = utility.getVideoMeta(context);

        expect(result.video).toBe(video);
        expect(result.fileName).toBe('clip.mp4');
      });

      it('should return meta and set_name for VIDEO_STICKER type', () => {
        const meta = { file_id: 'stk1', file_unique_id: 'uid2', set_name: 'sticker_set' };

        const context = {
          state: {
            photo: {
              type: ImageType.VIDEO_STICKER,
              meta,
            },
          },
        } as any;

        const result = utility.getVideoMeta(context);

        expect(result.video).toBe(meta);
        expect(result.fileName).toBe('sticker_set');
      });

      it('should return animation and fileName for ANIMATION type', () => {
        const animation = { file_id: 'anim1', file_unique_id: 'uid3', file_name: 'cat.gif', width: 0, height: 0, duration: 0 };

        const context = {
          state: {
            photo: {
              type: ImageType.ANIMATION,
              animation,
            },
          },
        } as any;

        const result = utility.getVideoMeta(context);

        expect(result.video).toBe(animation);
        expect(result.fileName).toBe('cat.gif');
      });

      it('should return videoNote and file_unique_id for VIDEO_NOTE type', () => {
        const videoNote = { file_id: 'vn1', file_unique_id: 'uid4', length: 100, duration: 10 };

        const context = {
          state: {
            photo: {
              type: ImageType.VIDEO_NOTE,
              videoNote,
            },
          },
        } as any;

        const result = utility.getVideoMeta(context);

        expect(result.video).toBe(videoNote);
        expect(result.fileName).toBe('uid4');
      });
    });

    describe('negative cases', () => {
      it('should throw when the photo type has no registered handler', () => {
        const context = buildVideoContext(ImageType.PHOTO, {});

        expect(() => utility.getVideoMeta(context)).toThrow(/No method for photo/);
      });

      it('should throw with the type name in the error message', () => {
        const context = buildVideoContext(ImageType.UNKNOWN, {});

        expect(() => utility.getVideoMeta(context)).toThrow(/No method for unknown/);
      });

      it('should throw with empty string when photo type is undefined', () => {
        const context = { state: { photo: undefined } } as any;

        expect(() => utility.getVideoMeta(context)).toThrow(/No method for /);
      });
    });
  });

  describe('downloadVideo', () => {
    describe('positive cases', () => {
      it('should return videoName using fileName when provided', async () => {
        const video = { file_id: 'f1', file_unique_id: 'u1' };

        const result = await utility.downloadVideo(video as any, 'video.MP4');

        expect(result.videoName).toBe('u1-video.mp4');
      });

      it('should fall back to unknown-type.mp4 when fileName is undefined', async () => {
        const video = { file_id: 'f2', file_unique_id: 'u2' };

        // eslint-disable-next-line unicorn/no-useless-undefined
        const result = await utility.downloadVideo(video as any, undefined);

        expect(result.videoName).toBe('u2-unknown-type.mp4');
      });

      it('should download the file when file_path is present', async () => {
        const video = { file_id: 'f3', file_unique_id: 'u3' };

        mockApi.getFile.mockResolvedValue({ file_path: 'path/to/file.mp4' });
        mockedAxiosGet.mockResolvedValue({ data: Buffer.from('binary') } as any);

        const result = await utility.downloadVideo(video as any, 'file.mp4');

        expect(mockedAxiosGet).toHaveBeenCalledWith(expect.stringContaining('test-bot-token/path/to/file.mp4'), {
          responseType: 'arraybuffer',
        });

        expect(result.videoFile).toEqual(Buffer.from('binary'));
      });

      it('should return null as videoFile when file_path is absent', async () => {
        const video = { file_id: 'f4', file_unique_id: 'u4' };

        mockApi.getFile.mockResolvedValue({ file_path: undefined });

        const result = await utility.downloadVideo(video as any, 'clip.mp4');

        expect(result.videoFile).toBeNull();
        expect(mockedAxiosGet).not.toHaveBeenCalled();
      });
    });
  });

  describe('getVideo', () => {
    describe('positive cases', () => {
      it('should call getVideoMeta then downloadVideo and return the result', async () => {
        const video = { file_id: 'v1', file_unique_id: 'vu1', file_name: 'test.mp4', width: 0, height: 0, duration: 0 };

        const context = {
          state: {
            photo: {
              type: ImageType.VIDEO,
              video,
              meta: {},
            },
          },
        } as any;

        mockApi.getFile.mockResolvedValue({ file_path: 'videos/test.mp4' });
        mockedAxiosGet.mockResolvedValue({ data: Buffer.from('vid') } as any);

        const result = await utility.getVideo(context);

        expect(result.videoName).toBe('vu1-test.mp4');
        expect(result.videoFile).toEqual(Buffer.from('vid'));
      });
    });
  });
});
