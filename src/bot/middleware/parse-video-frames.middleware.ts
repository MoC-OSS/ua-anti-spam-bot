import axios from 'axios';
import FormData from 'form-data';

import { environmentConfig } from '../../config';
import type { GrammyMiddleware, ParseVideoSuccessResponseBody } from '../../types';
import { ImageType } from '../../types';
import { handleError } from '../../utils';
import { videoService } from '../../video';

const host = `http://${environmentConfig.HOST}:${environmentConfig.PORT}`;

/**
 * @description
 * Parse video frames and saves into `context.state.photo.fileFrames`
 * */
export const parseVideoFrames: GrammyMiddleware = async (context, next) => {
  const MAX_VIDEO_SIZE = 20_000_000; // 20Mb

  const { photo } = context.state;

  /**
   * If no photo in state
   * */
  if (!photo) {
    return next();
  }

  const isVideo = photo.type === ImageType.VIDEO;
  const isAnimation = photo.type === ImageType.ANIMATION;

  const isVideoContent = isVideo || isAnimation;

  if (isVideoContent) {
    const videoMeta = isVideo ? photo.video : isAnimation ? photo.animation : null;
    const isVideoSmall = videoMeta && (videoMeta.file_size || 0) < MAX_VIDEO_SIZE;

    /**
     * Checks whatever is it video or animation and if it has a meta.
     * */
    const isValidVideoContent = videoMeta && isVideoSmall;

    if (isValidVideoContent) {
      const videoName = `${videoMeta.file_unique_id}-${videoMeta.file_name?.toLowerCase() || 'unknown-type'}`;
      const videoFile = await context.api.getFile(videoMeta.file_id).then((photoResponse) =>
        photoResponse.file_path
          ? axios
              .get<Buffer>(`https://api.telegram.org/file/bot${environmentConfig.BOT_TOKEN}/${photoResponse.file_path}`, {
                responseType: 'arraybuffer',
              })
              .then((response) => response.data)
          : null,
      );

      if (!videoFile) {
        console.info('IMPOSSIBLE: There is no video.', videoMeta);
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
        photo.fileFrames = responseFiles;
      }
    }
  }

  return next();
};
