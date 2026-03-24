import fsp from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { ffmpegCommandMock, ffmpegFactoryMock } = vi.hoisted(() => {
  const commandMock = {
    aspect: vi.fn(),
    autopad: vi.fn(),
    ffprobe: vi.fn(),
    input: vi.fn(),
    on: vi.fn(),
    output: vi.fn(),
    run: vi.fn(),
    screenshots: vi.fn(),
    setFfmpegPath: vi.fn(),
    setFfprobePath: vi.fn(),
    size: vi.fn(),
  };

  return {
    ffmpegCommandMock: commandMock,
    ffmpegFactoryMock: vi.fn(() => commandMock),
  };
});

vi.mock('ffmpeg-static', () => ({
  default: '/usr/bin/ffmpeg',
}));

vi.mock('ffprobe-static', () => ({
  path: '/usr/bin/ffprobe',
}));

vi.mock('fluent-ffmpeg', () => ({
  default: ffmpegFactoryMock,
}));

const { VideoService } = await import('@video/video.service');

type VideoServiceInstance = InstanceType<typeof VideoService>;

describe('VideoService', () => {
  let service: VideoServiceInstance;

  beforeEach(() => {
    service = new VideoService();
    vi.restoreAllMocks();
    ffmpegFactoryMock.mockClear();
    ffmpegCommandMock.aspect.mockReturnThis();
    ffmpegCommandMock.autopad.mockReturnThis();
    ffmpegCommandMock.ffprobe.mockReset();
    ffmpegCommandMock.input.mockReturnThis();
    ffmpegCommandMock.on.mockReturnThis();
    ffmpegCommandMock.output.mockReturnThis();
    ffmpegCommandMock.run.mockReset();
    ffmpegCommandMock.screenshots.mockReset();
    ffmpegCommandMock.setFfmpegPath.mockReset();
    ffmpegCommandMock.setFfprobePath.mockReset();
    ffmpegCommandMock.size.mockReturnThis();
  });

  describe('spawnCommand', () => {
    describe('positive cases', () => {
      it('configures ffmpeg and ffprobe paths on the command', () => {
        const command = service.spawnCommand();

        expect(command).toBe(ffmpegCommandMock);
        expect(ffmpegFactoryMock).toHaveBeenCalledOnce();
        expect(ffmpegCommandMock.setFfmpegPath).toHaveBeenCalledWith('/usr/bin/ffmpeg');
        expect(ffmpegCommandMock.setFfprobePath).toHaveBeenCalledWith('/usr/bin/ffprobe');
      });
    });
  });

  describe('getVideoProbe', () => {
    describe('positive cases', () => {
      it('resolves metadata from ffprobe', async () => {
        const probeData = {
          format: { duration: 10 },
        };

        ffmpegCommandMock.ffprobe.mockImplementation((callback: (error: undefined, data: typeof probeData) => void) => {
          callback(undefined, probeData);
        });

        const result = await service.getVideoProbe(new URL('probe.mp4', service.saveFolderPath));

        expect(result).toEqual(probeData);
        expect(ffmpegCommandMock.input).toHaveBeenCalled();
      });
    });
  });

  describe('buildTempFileName', () => {
    describe('positive cases', () => {
      it('sanitizes the file name and keeps it unique', () => {
        const temporaryFileName = service.buildTempFileName('clip name?.mp4');

        expect(temporaryFileName).not.toBe('clip name?.mp4');
        expect(temporaryFileName).toMatch(/clip_name_\.mp4$/);
      });
    });
  });

  describe('removeTempFile', () => {
    describe('negative cases', () => {
      it('ignores missing files during cleanup', async () => {
        vi.spyOn(fsp, 'unlink').mockRejectedValue(Object.assign(new Error('missing file'), { code: 'ENOENT' }));

        await expect(service.removeTempFile(new URL('missing.mp4', service.saveFolderPath))).resolves.toBeUndefined();
      });

      it('rethrows permission errors during cleanup', async () => {
        vi.spyOn(fsp, 'unlink').mockRejectedValue(Object.assign(new Error('permission denied'), { code: 'EACCES' }));

        await expect(service.removeTempFile(new URL('denied.mp4', service.saveFolderPath))).rejects.toThrow('permission denied');
      });
    });
  });

  describe('ensureSaveFolder', () => {
    describe('positive cases', () => {
      it('creates the temp folder recursively', async () => {
        const mkdirSpy = vi.spyOn(fsp, 'mkdir').mockResolvedValue(undefined as never);

        await service.ensureSaveFolder();

        expect(mkdirSpy).toHaveBeenCalledWith(service.saveFolderPath, { recursive: true });
      });
    });
  });

  describe('extractFrames', () => {
    describe('positive cases', () => {
      it('uses a unique temp file name instead of the raw input file name', async () => {
        const writeFileSpy = vi.spyOn(fsp, 'writeFile').mockResolvedValue();
        const unlinkSpy = vi.spyOn(fsp, 'unlink').mockResolvedValue();
        const takeScreenshotsSpy = vi.spyOn(service, 'takeScreenshotsFs').mockResolvedValue([Buffer.from('frame')]);

        vi.spyOn(service, 'ensureSaveFolder').mockResolvedValue();

        vi.spyOn(service, 'getVideoProbe').mockResolvedValue({
          format: { duration: 2 },
        } as never);

        await service.extractFrames(Buffer.from('video'), 'clip.mp4');

        const writtenFile = writeFileSpy.mock.calls[0]?.[0];
        const screenshotFileName = takeScreenshotsSpy.mock.calls[0]?.[1];

        expect(writeFileSpy).toHaveBeenCalledOnce();
        expect(writtenFile).toBeInstanceOf(URL);
        expect(fileURLToPath(writtenFile as URL)).not.toMatch(/\/clip\.mp4$/);
        expect(fileURLToPath(writtenFile as URL)).toMatch(/clip\.mp4$/);
        expect(screenshotFileName).not.toBe('clip.mp4');
        expect(screenshotFileName).toMatch(/clip\.mp4$/);
        expect(unlinkSpy).toHaveBeenCalledWith(writtenFile);
      });
    });

    describe('negative cases', () => {
      it('removes the temp input file when probing fails', async () => {
        const writeFileSpy = vi.spyOn(fsp, 'writeFile').mockResolvedValue();
        const unlinkSpy = vi.spyOn(fsp, 'unlink').mockResolvedValue();

        vi.spyOn(service, 'ensureSaveFolder').mockResolvedValue();

        vi.spyOn(service, 'getVideoProbe').mockRejectedValue(new Error('ffprobe failed'));

        await expect(service.extractFrames(Buffer.from('video'), 'broken.mp4')).resolves.toEqual([]);

        const writtenFile = writeFileSpy.mock.calls[0]?.[0];

        expect(unlinkSpy).toHaveBeenCalledWith(writtenFile);
      });

      it('returns no frames when takeScreenshotsFs fails', async () => {
        vi.spyOn(fsp, 'writeFile').mockResolvedValue();
        vi.spyOn(fsp, 'unlink').mockResolvedValue();
        vi.spyOn(service, 'ensureSaveFolder').mockResolvedValue();
        vi.spyOn(service, 'getVideoProbe').mockResolvedValue({ format: { duration: 2 } } as never);
        vi.spyOn(service, 'takeScreenshotsFs').mockRejectedValue(new Error('ffprobe exited with code 1'));

        await expect(service.extractFrames(Buffer.from('video'), 'clip.mp4')).resolves.toEqual([]);
      });

      it('returns no frames when ffprobe reports an invalid duration', async () => {
        const unlinkSpy = vi.spyOn(fsp, 'unlink').mockResolvedValue();

        vi.spyOn(service, 'ensureSaveFolder').mockResolvedValue();

        vi.spyOn(fsp, 'writeFile').mockResolvedValue();

        vi.spyOn(service, 'getVideoProbe').mockResolvedValue({
          format: { duration: 0 },
        } as never);

        await expect(service.extractFrames(Buffer.from('video'), 'durationless.mp4')).resolves.toEqual([]);

        expect(unlinkSpy).toHaveBeenCalledOnce();
      });
    });
  });

  describe('convertToVideoNote', () => {
    describe('positive cases', () => {
      it('uses unique temp input and output file names for buffer conversions', async () => {
        let endCallback: (() => void) | undefined;

        const writeFileSpy = vi.spyOn(fsp, 'writeFile').mockResolvedValue();
        const readFileSpy = vi.spyOn(fsp, 'readFile').mockResolvedValue(Buffer.from('video-note'));
        const unlinkSpy = vi.spyOn(fsp, 'unlink').mockResolvedValue();

        vi.spyOn(service, 'ensureSaveFolder').mockResolvedValue();

        vi.spyOn(service, 'spawnCommand').mockReturnValue({
          input: vi.fn().mockReturnThis(),
          size: vi.fn().mockReturnThis(),
          aspect: vi.fn().mockReturnThis(),
          autopad: vi.fn().mockReturnThis(),
          output: vi.fn().mockReturnThis(),
          on(event: string, callback: () => void) {
            if (event === 'end') {
              endCallback = callback;
            }

            return this;
          },
          run() {
            endCallback?.();
          },
        } as never);

        const result = await service.convertToVideoNote(Buffer.from('video'), '14_2024_.gif');

        const inputPath = writeFileSpy.mock.calls[0]?.[0];
        const outputPath = readFileSpy.mock.calls[0]?.[0];

        expect(result).toEqual(Buffer.from('video-note'));
        expect(inputPath).toBeInstanceOf(URL);
        expect(outputPath).toBeInstanceOf(URL);
        expect(fileURLToPath(inputPath as URL)).not.toMatch(/\/14_2024_\.gif\.mp4$/);
        expect(fileURLToPath(inputPath as URL)).toMatch(/14_2024_\.gif\.mp4$/);
        expect(fileURLToPath(outputPath as URL)).toMatch(/video-note\.mp4$/);
        expect(unlinkSpy).toHaveBeenCalledWith(inputPath);
        expect(unlinkSpy).toHaveBeenCalledWith(outputPath);
      });

      it('keeps source URL files and only cleans up the generated output file', async () => {
        let endCallback: (() => void) | undefined;

        const readFileSpy = vi.spyOn(fsp, 'readFile').mockResolvedValue(Buffer.from('video-note'));
        const unlinkSpy = vi.spyOn(fsp, 'unlink').mockResolvedValue();
        const sourceVideoPath = new URL('source.mp4', service.saveFolderPath);

        vi.spyOn(service, 'ensureSaveFolder').mockResolvedValue();

        vi.spyOn(service, 'spawnCommand').mockReturnValue({
          input: vi.fn().mockReturnThis(),
          size: vi.fn().mockReturnThis(),
          aspect: vi.fn().mockReturnThis(),
          autopad: vi.fn().mockReturnThis(),
          output: vi.fn().mockReturnThis(),
          on(event: string, callback: () => void) {
            if (event === 'end') {
              endCallback = callback;
            }

            return this;
          },
          run() {
            endCallback?.();
          },
        } as never);

        await service.convertToVideoNote(sourceVideoPath, undefined as never);

        const outputPath = readFileSpy.mock.calls[0]?.[0];

        expect(unlinkSpy).not.toHaveBeenCalledWith(sourceVideoPath);
        expect(unlinkSpy).toHaveBeenCalledWith(outputPath);
      });
    });

    describe('negative cases', () => {
      it('cleans up temp files when ffmpeg conversion fails', async () => {
        let errorCallback: ((error: Error) => void) | undefined;

        const writeFileSpy = vi.spyOn(fsp, 'writeFile').mockResolvedValue();
        const unlinkSpy = vi.spyOn(fsp, 'unlink').mockResolvedValue();

        vi.spyOn(service, 'ensureSaveFolder').mockResolvedValue();

        vi.spyOn(service, 'spawnCommand').mockReturnValue({
          input: vi.fn().mockReturnThis(),
          size: vi.fn().mockReturnThis(),
          aspect: vi.fn().mockReturnThis(),
          autopad: vi.fn().mockReturnThis(),
          output: vi.fn().mockReturnThis(),
          on(event: string, callback: (error: Error) => void) {
            if (event === 'error') {
              errorCallback = callback;
            }

            return this;
          },
          run() {
            errorCallback?.(new Error('ffmpeg failed'));
          },
        } as never);

        await expect(service.convertToVideoNote(Buffer.from('video'), 'broken.gif')).rejects.toThrow('ffmpeg failed');

        const inputPath = writeFileSpy.mock.calls[0]?.[0];

        expect(unlinkSpy).toHaveBeenCalledWith(inputPath);
      });
    });
  });

  describe('takeScreenshotsFs', () => {
    describe('negative cases', () => {
      it('rejects when ffmpeg emits an error event', async () => {
        vi.spyOn(service, 'spawnCommand').mockReturnValue({
          input: vi.fn().mockReturnThis(),
          on(event: string, callback: (error: Error) => void) {
            if (event === 'error') {
              callback(new Error('ffprobe exited with code 1'));
            }

            return this;
          },
          screenshots: vi.fn().mockReturnThis(),
        } as never);

        await expect(service.takeScreenshotsFs(new URL('input.mp4', service.saveFolderPath), 'clip.mp4', 2)).rejects.toThrow(
          'ffprobe exited with code 1',
        );
      });
    });

    describe('positive cases', () => {
      it('passes explicit second-based timestamps to avoid an internal ffprobe call', async () => {
        // duration=4 → count=min(10,ceil(4))=4 → timestamps=[0.5, 1.5, 2.5, 3.5]
        const screenshotsSpy = vi.fn().mockReturnThis();

        vi.spyOn(service, 'spawnCommand').mockReturnValue({
          input: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          screenshots: screenshotsSpy,
        } as never);

        service.takeScreenshotsFs(new URL('input.mp4', service.saveFolderPath), 'clip.mp4', 4).catch(() => {});

        const [options] = screenshotsSpy.mock.calls[0] as [Record<string, unknown>];

        expect(options).not.toHaveProperty('count');
        expect(options.timestamps).toEqual([0.5, 1.5, 2.5, 3.5]);
      });

      it('reads generated screenshots and removes them afterwards', async () => {
        let filenamesCallback: ((fileNames: string[]) => void) | undefined;
        let endCallback: (() => void) | undefined;

        const readFileSpy = vi
          .spyOn(fsp, 'readFile')
          .mockResolvedValueOnce(Buffer.from('frame-1'))
          .mockResolvedValueOnce(Buffer.from('frame-2'));

        const unlinkSpy = vi.spyOn(fsp, 'unlink').mockResolvedValue();

        vi.spyOn(service, 'spawnCommand').mockReturnValue({
          input: vi.fn().mockReturnThis(),
          on(event: string, callback: (() => void) | ((fileNames: string[]) => void)) {
            if (event === 'filenames') {
              filenamesCallback = callback as (fileNames: string[]) => void;
            }

            if (event === 'end') {
              endCallback = callback as () => void;
            }

            return this;
          },
          screenshots() {
            filenamesCallback?.(['shot-1.png', 'shot-2.png']);
            endCallback?.();
          },
        } as never);

        const result = await service.takeScreenshotsFs(new URL('input.mp4', service.saveFolderPath), 'clip.mp4', 2);

        const firstGeneratedPath = readFileSpy.mock.calls[0]?.[0];
        const secondGeneratedPath = readFileSpy.mock.calls[1]?.[0];

        expect(result).toEqual([Buffer.from('frame-1'), Buffer.from('frame-2')]);
        expect(firstGeneratedPath).toBeInstanceOf(URL);
        expect(secondGeneratedPath).toBeInstanceOf(URL);
        expect(unlinkSpy).toHaveBeenCalledWith(firstGeneratedPath);
        expect(unlinkSpy).toHaveBeenCalledWith(secondGeneratedPath);
      });
    });
  });
});
