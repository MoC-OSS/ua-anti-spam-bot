import fsp from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as util from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import { path as ffprobePath } from 'ffprobe-static';
import type { FfprobeData } from 'fluent-ffmpeg';
import ffmpeg from 'fluent-ffmpeg';

/**
 * Service that helps to work with video content
 * */
export class VideoService {
  readonly saveFolderPath = new URL('temp/', import.meta.url);

  /**
   * Create a `ffmpeg` command with specified `ffmpeg` and `ffprobe` binaries
   * */
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
   * @param video - MP4 buffer video
   * @param filename - name to save in fs, should include extension
   * @param duration - duration of the video
   * */
  async extractFrames(video: Buffer, filename: string, duration?: number) {
    let localDuration = duration;
    const videoFile = new URL(filename, this.saveFolderPath);

    await fsp.writeFile(videoFile, video);

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
         * */
        return [];
      }
    }

    return this.takeScreenshotsFs(videoFile, filename, localDuration);
  }

  /**
   * Returns video stats such as duration, width, height, and other meta
   *
   * @param videoFile - video to get meta
   * */
  getVideoProbe(videoFile: URL): Promise<FfprobeData> {
    const command = this.spawnCommand();
    return util.promisify<FfprobeData>((callback) => command.input(fileURLToPath(videoFile)).ffprobe(callback))();
  }

  /**
   * Convert a video into a round video note square video.
   * Resizes it to 512x512 with auto paddings.
   * */
  async convertToVideoNote(videoFile: URL, fileName: never): Promise<Buffer>;

  async convertToVideoNote(videoFile: Buffer, fileName: string): Promise<Buffer>;

  async convertToVideoNote(videoFile: URL | Buffer, fileName: string): Promise<Buffer> {
    let videoPath: URL;
    let outputVideoName: string;

    if (videoFile instanceof URL) {
      /**
       * A regular file, just read it
       * */
      videoPath = videoFile;
      outputVideoName = `${fileURLToPath(videoFile).split('/').splice(-1)[0]}-video-note.mp4`;
    } else {
      /**
       * Passed buffer, need to be saved and deleted after the operation
       * */
      videoPath = new URL(`${fileName}.mp4`, this.saveFolderPath);
      outputVideoName = `${new Date().toString()}-video-note.mp4`;
      await fsp.writeFile(videoPath, videoFile);
    }

    const outputVideoPath = new URL(outputVideoName, this.saveFolderPath);

    const command = this.spawnCommand();

    await new Promise((resolve) => {
      command
        .input(fileURLToPath(videoPath))
        .size('512x?')
        .aspect('1:1')
        .autopad()
        .output(fileURLToPath(outputVideoPath))
        .on('end', () => {
          resolve(null);
        })
        .run();
    });

    const outputVideoBuffer = await fsp.readFile(outputVideoPath);

    /**
     * Remove files from FS
     * */
    await fsp.unlink(videoPath);
    await fsp.unlink(outputVideoPath);

    return outputVideoBuffer;
  }

  /**
   * @description Receives video, video name, and timestamps to generate buffers.<br>
   *
   * 1) It calls FFMPEG to capture screenshot on the passed timestamps;<br>
   * 2) FFMPEG generates them and saves in FS;<br>
   * 3) It reads these files, deletes, and returns them.
   *
   * @param videoFile - video file path to process
   * @param filename - name to save in fs, should include extension
   * @param duration - duration of the video
   * */
  async takeScreenshotsFs(videoFile: URL, filename: string, duration: number) {
    const command = this.spawnCommand();

    /**
     * Convert video into screenshots and return files
     * */
    const fileNamePaths = await new Promise<string[]>((resolve) => {
      let localFileNames: string[] = [];

      command
        .input(fileURLToPath(videoFile))
        .on('filenames', (generatedFileNames: string[]) => {
          localFileNames = generatedFileNames;
        })
        .on('end', () => {
          resolve(localFileNames);
        })
        .screenshots({
          size: '640x?',
          filename: `${filename}-%0i.png`,
          count: Math.min(10, Math.ceil(duration)),
          folder: fileURLToPath(this.saveFolderPath),
        });
    });

    /**
     * Join to have full paths
     * */
    const fullFileNamePaths = fileNamePaths.map((filePath) => new URL(filePath, this.saveFolderPath));

    /**
     * Load files from FS
     * */
    const screenshotBuffers = await Promise.all(fullFileNamePaths.map((fullPath) => fsp.readFile(fullPath)));

    /**
     * Remove files from FS
     * */
    await Promise.all(fullFileNamePaths.map((fullPath) => fsp.unlink(fullPath)));
    await fsp.unlink(videoFile);

    return screenshotBuffers;
  }
}

export const videoService = new VideoService();
