/* eslint-disable unicorn/prefer-module */
import fsp from 'node:fs/promises';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import * as util from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import { path as ffprobePath } from 'ffprobe-static';
import type { FfprobeData } from 'fluent-ffmpeg';
import ffmpeg from 'fluent-ffmpeg';

/**
 * Service that helps to work with video content
 * */
export class VideoService {
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
   * @param id - id of the file
   * */
  async extractFrames(video: Buffer, id: string) {
    const fileStat: FfprobeData = await this.getVideoProbe(video);
    const { duration } = fileStat.streams[0];

    if (!duration) {
      throw new Error('Video has no duration');
    }

    const timestamps = this.getTimeStampsForDuration(+duration);

    return this.takeScreenshotsFs(video, id, timestamps);
  }

  /**
   * Returns video stats such as duration, width, height, and other meta
   *
   * @param video - video to get meta
   * */
  getVideoProbe(video: Buffer): Promise<FfprobeData> {
    const videoStream = Readable.from(video);
    const command = this.spawnCommand();
    return util.promisify<FfprobeData>((callback) => command.input(videoStream).ffprobe(callback))();
  }

  /**
   * Calculates timestamps for passed duration
   *
   * @param duration - duration to split into timestamps
   *
   * @returns second count for duration less 10s or (duration / 10) * index if more 10s
   * */
  getTimeStampsForDuration(duration: number) {
    if (duration <= 10) {
      return Array.from({ length: Math.ceil(duration) }).map((value, index) => index);
    }

    return Array.from({ length: 10 }).map((value, index) => (duration / 10) * index);
  }

  /**
   * @description Receives video, video name, and timestamps to generate buffers.<br>
   *
   * 1) It calls FFMPEG to capture screenshot on the passed timestamps;<br>
   * 2) FFMPEG generates them and saves in FS;<br>
   * 3) It reads these files, deletes, and returns them.
   *
   * @param video - video to process
   * @param id - name or id of the file
   * @param timestamps - timestamps to scrape from video
   * */
  async takeScreenshotsFs(video: Buffer, id: string, timestamps: number[]) {
    const videoStream = Readable.from(video);
    const command = this.spawnCommand();
    const saveFolderPath = `${__dirname}/temp`;

    /**
     * Convert video into screenshots and return files
     * */
    const fileNamePaths = await new Promise<string[]>((resolve) => {
      let localFileNames: string[] = [];

      command
        .input(videoStream)
        .fps(1)
        .on('filenames', (generatedFileNames: string[]) => {
          localFileNames = generatedFileNames;
        })
        .on('end', () => {
          resolve(localFileNames);
        })
        .screenshots({
          filename: id,
          timestamps,
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

    return screenshotBuffers;
  }
}

export const videoService = new VideoService();
