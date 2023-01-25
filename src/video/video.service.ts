/* eslint-disable unicorn/prefer-module */
import fsp from 'node:fs/promises';
import * as path from 'node:path';
import * as util from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import { path as ffprobePath } from 'ffprobe-static';
import type { FfprobeData } from 'fluent-ffmpeg';
import ffmpeg from 'fluent-ffmpeg';

/**
 * Service that helps to work with video content
 * */
export class VideoService {
  readonly saveFolderPath = `${__dirname}/temp`;

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
    const videoFile = path.join(this.saveFolderPath, filename);

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
  getVideoProbe(videoFile: string): Promise<FfprobeData> {
    const command = this.spawnCommand();
    return util.promisify<FfprobeData>((callback) => command.input(videoFile).ffprobe(callback))();
  }

  /**
   * Convert a video into a round video note square video.
   * Resizes it to 512x512 with auto paddings.
   * */
  async convertToVideoNote(videoFile: string | Buffer): Promise<Buffer> {
    let videoPath: string;
    let outputVideoName: string;

    if (typeof videoFile === 'string') {
      /**
       * A regular file, just read it
       * */
      videoPath = videoFile;
      outputVideoName = `${videoFile.split('/').splice(-1)[0]}-video-note.mp4`;
    } else {
      /**
       * Passed buffer, need to be saved and deleted after the operation
       * */
      videoPath = path.join(this.saveFolderPath, `${new Date().toString()}.mp4`);
      outputVideoName = `${new Date().toString()}-video-note.mp4`;
      await fsp.writeFile(videoFile, videoPath);
    }

    const outputVideoPath = path.join(this.saveFolderPath, outputVideoName);

    const command = this.spawnCommand();

    await new Promise((resolve) => {
      command
        .input(videoPath)
        .size('512x?')
        .aspect('1:1')
        .autopad()
        .output(outputVideoPath)
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
  async takeScreenshotsFs(videoFile: string, filename: string, duration: number) {
    const command = this.spawnCommand();
    const saveFolderPath = `${__dirname}/temp`;

    /**
     * Convert video into screenshots and return files
     * */
    const fileNamePaths = await new Promise<string[]>((resolve) => {
      let localFileNames: string[] = [];

      command
        .input(videoFile)
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
          folder: saveFolderPath,
        });
    });

    /**
     * Join to have full paths
     * */
    const fullFileNamePaths = fileNamePaths.map((filePath) => path.join(saveFolderPath, filePath));

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
