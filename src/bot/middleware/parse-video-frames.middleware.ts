import axios from 'axios';
import FormData from 'form-data';

import type { GrammyMiddleware } from '@app-types/context';
import type { ParseVideoSuccessResponseBody } from '@app-types/express';
import type { StateImageParsedFrames } from '@app-types/state';

import { handleError } from '@utils/error-handler.util';
import { logger } from '@utils/logger.util';
import { videoUtility } from '@utils/video.util';

import { videoService } from '@video/video.service';

import { environmentConfig } from '../../config';

const host = `http://${environmentConfig.HOST}:${environmentConfig.PORT}`;

/**
 * @description
 * Parse video frames and saves into `context.state.photo.fileFrames`
 * */
export const parseVideoFrames: GrammyMiddleware = async (context, next) => {
  /**
   * @reason https://core.telegram.org/bots/faq#how-do-i-download-files
   * @workaround https://stackoverflow.com/questions/63410408/is-there-any-workarounds-for-downloading-files-20-mb-that-are-sent-to-bot-i
   * */
  const MAX_VIDEO_SIZE = 20_000_000; // 20Mb

  const hasVideo = videoUtility.isContextWithVideo(context);

  /**
   * If no video in state
   * */
  if (!hasVideo) {
    return next();
  }

  /**
   * Main logic
   */
  const { video, fileName } = videoUtility.getVideoMeta(context);

  const isVideoSmall = (video.file_size || 0) < MAX_VIDEO_SIZE;

  /**
   * Checks whatever is it video or animation and if it has a meta.
   * */
  if (isVideoSmall) {
    const { videoFile, videoName } = await videoUtility.downloadVideo(video, fileName);

    if (!videoFile) {
      logger.info({ video }, 'IMPOSSIBLE: There is no video.');

      return next();
    }

    let responseFiles: Buffer[];

    try {
      const formData = new FormData();

      formData.append('video', videoFile, { filename: videoName });

      const getServerResponse = () =>
        axios
          .post<ParseVideoSuccessResponseBody>(`${host}/parse-video`, formData, {
            headers: formData.getHeaders(),
          })
          .then((response) => response.data.screenshots.map((screenshot) => Buffer.from(screenshot.data)));

      responseFiles = await (environmentConfig.USE_SERVER ? getServerResponse() : videoService.extractFrames(videoFile, videoName));
    } catch (error) {
      handleError(error, 'API_DOWN');
      responseFiles = await videoService.extractFrames(videoFile, videoName);
    }

    if (responseFiles && responseFiles.length > 0) {
      (context.state.photo as StateImageParsedFrames).fileFrames = responseFiles;
    }
  }

  return next();
};
