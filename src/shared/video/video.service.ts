import { randomUUID } from 'node:crypto';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import ffmpegPath from 'ffmpeg-static';
import { path as ffprobePath } from 'ffprobe-static';
import type { FfprobeData } from 'fluent-ffmpeg';
import ffmpeg from 'fluent-ffmpeg';

/**
 * Service that helps to work with video content
 */
export class VideoService {
  readonly saveFolderPath = new URL('temp/', import.meta.url);

  /**
   * Ensures the temp folder exists before writing transient video artifacts.
   * @returns A promise that resolves when the temp folder is ready
   */
  async ensureSaveFolder(): Promise<void> {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fsp.mkdir(this.saveFolderPath, { recursive: true });
  }

  /**
   * Builds a unique temp file name so concurrent or repeated requests never reuse stale files.
   * @param fileName - original logical file name
   * @returns A randomized safe file name for temp storage
   */
  buildTempFileName(fileName: string): string {
    const safeFileName = fileName.replaceAll(/[^a-zA-Z0-9._-]/g, '_') || 'video.tmp';

    return `${randomUUID()}-${safeFileName}`;
  }

  /**
   * Removes a temp file if it exists.
   * @param filePath - file to remove
   * @returns A promise that resolves when cleanup is complete
   */
  async removeTempFile(filePath: URL): Promise<void> {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fsp.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Create a `ffmpeg` command with specified `ffmpeg` and `ffprobe` binaries
   * @returns A configured fluent-ffmpeg command instance
   */
  spawnCommand() {
    if (!ffmpegPath || !ffprobePath) {
      throw new Error('No ffmpeg');
    }

    const command = ffmpeg();

    command.setFfmpegPath(ffmpegPath);
    command.setFfprobePath(ffprobePath);

    return command;
  }

  /**
   * Extracts evenly-spaced frames from an MP4 video buffer using ffmpeg.
   * @param video - MP4 buffer video
   * @param filename - name to save in fs, should include extension
   * @param duration - duration of the video
   * @returns A promise resolving to an array of screenshot buffers, or an empty array if not a video
   */
  async extractFrames(video: Buffer, filename: string, duration?: number) {
    await this.ensureSaveFolder();

    let localDuration = duration;
    const temporaryFileName = this.buildTempFileName(filename);
    const videoFile = new URL(temporaryFileName, this.saveFolderPath);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fsp.writeFile(videoFile, video);

    try {
      if (!localDuration) {
        try {
          const fileStat: FfprobeData = await this.getVideoProbe(videoFile);

          if (!fileStat.format.duration || fileStat.format.duration < 0.1) {
            throw new Error('Video has no duration');
          }

          localDuration = fileStat.format.duration;
        } catch {
          /**
           * This is not a video so there is no frames
           */
          return [];
        }
      }

      try {
        return await this.takeScreenshotsFs(videoFile, temporaryFileName, localDuration);
      } catch {
        return [];
      }
    } finally {
      await this.removeTempFile(videoFile);
    }
  }

  /**
   * Returns video stats such as duration, width, height, and other meta
   * @param videoFile - video to get meta
   * @returns A promise resolving to an FfprobeData object with video metadata
   */
  getVideoProbe(videoFile: URL): Promise<FfprobeData> {
    const command = this.spawnCommand();

    return promisify<FfprobeData>((callback) => command.input(fileURLToPath(videoFile)).ffprobe(callback))();
  }

  /**
   * Convert a video into a round video note square video.
   * Resizes it to 512x512 with auto paddings.
   */
  async convertToVideoNote(videoFile: URL, fileName: never): Promise<Buffer>;

  async convertToVideoNote(videoFile: Buffer, fileName: string): Promise<Buffer>;

  async convertToVideoNote(videoFile: Buffer | URL, fileName: string): Promise<Buffer> {
    await this.ensureSaveFolder();

    let videoPath: URL;
    let shouldRemoveInputFile = false;

    if (videoFile instanceof URL) {
      /**
       * A regular file, just read it
       */
      videoPath = videoFile;
    } else {
      /**
       * Passed buffer, need to be saved and deleted after the operation
       */
      videoPath = new URL(this.buildTempFileName(`${fileName}.mp4`), this.saveFolderPath);
      shouldRemoveInputFile = true;
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fsp.writeFile(videoPath, videoFile);
    }

    const outputVideoName = this.buildTempFileName(`${path.basename(fileURLToPath(videoPath))}-video-note.mp4`);
    const outputVideoPath = new URL(outputVideoName, this.saveFolderPath);

    const command = this.spawnCommand();

    try {
      await new Promise<void>((resolve, reject) => {
        command
          .input(fileURLToPath(videoPath))
          .size('512x?')
          .aspect('1:1')
          .autopad()
          .output(fileURLToPath(outputVideoPath))
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          })
          .run();
      });

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return await fsp.readFile(outputVideoPath);
    } finally {
      if (shouldRemoveInputFile) {
        await this.removeTempFile(videoPath);
      }

      await this.removeTempFile(outputVideoPath);
    }
  }

  /**
   * Receives video, video name, and timestamps to generate buffers.
   *
   * 1) It calls FFMPEG to capture screenshot on the passed timestamps;<br>
   * 2) FFMPEG generates them and saves in FS;<br>
   * 3) It reads these files, deletes, and returns them.
   * @param videoFile - video file path to process
   * @param filename - name to save in fs, should include extension
   * @param duration - duration of the video
   * @returns A promise resolving to an array of screenshot buffers extracted from the video
   */
  async takeScreenshotsFs(videoFile: URL, filename: string, duration: number) {
    const command = this.spawnCommand();

    /**
     * Convert video into screenshots and return files
     */
    const fileNamePaths = await new Promise<string[]>((resolve, reject) => {
      let localFileNames: string[] = [];

      command
        .input(fileURLToPath(videoFile))
        .on('filenames', (generatedFileNames: string[]) => {
          localFileNames = generatedFileNames;
        })
        .on('error', (error) => {
          reject(error);
        })
        .on('end', () => {
          resolve(localFileNames);
        })
        .screenshots({
          size: '640x?',
          filename: `${filename}-%0i.png`,
          /**
           * Use explicit second-based timestamps derived from the already-known duration
           * instead of `count`. When `count` is used, fluent-ffmpeg converts it to percentage
           * timemarks (e.g. '20%', '40%') which triggers an internal ffprobe call to resolve
           * them to seconds. That second ffprobe call is the one that exits with code 1.
           * Passing seconds directly skips the internal probe entirely.
           */
          timestamps: (() => {
            const count = Math.min(10, Math.ceil(duration));

            return Array.from({ length: count }, (_, index) => (duration / count) * (index + 0.5));
          })(),
          folder: fileURLToPath(this.saveFolderPath),
        });
    });

    /**
     * Join to have full paths
     */
    const fullFileNamePaths = fileNamePaths.map((filePath) => new URL(filePath, this.saveFolderPath));

    /**
     * Load files from FS
     */
    try {
      return await Promise.all(
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fullFileNamePaths.map((fullPath) => fsp.readFile(fullPath)),
      );
    } finally {
      await Promise.all(fullFileNamePaths.map((fullPath) => this.removeTempFile(fullPath)));
    }
  }
}

export const videoService = new VideoService();
