import type { Sticker, Video } from '@grammyjs/types/message';
import axios from 'axios';
import FormData from 'form-data';

import { environmentConfig } from '../../config';
import type { GrammyMiddleware, ImageVideoTypes, ParseVideoSuccessResponseBody } from '../../types';
import { ImageType } from '../../types';
import type { StateImageAnimation, StateImageParsedFrames, StateImageVideo, StateImageVideoSticker } from '../../types/state';
import { handleError } from '../../utils';
import { videoService } from '../../video';

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

  const { photo } = context.state;

  /**
   * If no photo in state
   * */
  if (!photo) {
    return next();
  }

  /**
   * Video types to parse
   * */
  const getFileNameMap = new Map<ImageVideoTypes, () => { video: Video | Sticker; fileName: string | undefined }>();

  getFileNameMap.set(ImageType.VIDEO, () => {
    const meta = photo as StateImageVideo;

    return {
      video: meta.video,
      fileName: meta.video.file_name,
    };
  });

  getFileNameMap.set(ImageType.VIDEO_STICKER, () => {
    const meta = photo as StateImageVideoSticker;

    return {
      video: meta.meta,
      fileName: meta.meta.set_name,
    };
  });

  getFileNameMap.set(ImageType.ANIMATION, () => {
    const meta = photo as StateImageAnimation;

    return {
      video: meta.animation,
      fileName: meta.animation.file_name,
    };
  });

  /**
   * Main logic
   */
  const videoMethods = getFileNameMap.get(photo.type as ImageVideoTypes);

  if (videoMethods) {
    const { video, fileName } = videoMethods();

    const isVideoSmall = (video.file_size || 0) < MAX_VIDEO_SIZE;

    /**
     * Checks whatever is it video or animation and if it has a meta.
     * */
    if (isVideoSmall) {
      const videoName = `${video.file_unique_id}-${fileName?.toLowerCase() || 'unknown-type.mp4'}`;
      const videoFile = await context.api.getFile(video.file_id).then((photoResponse) =>
        photoResponse.file_path
          ? axios
              .get<Buffer>(`https://api.telegram.org/file/bot${environmentConfig.BOT_TOKEN}/${photoResponse.file_path}`, {
                responseType: 'arraybuffer',
              })
              .then((response) => response.data)
          : null,
      );

      if (!videoFile) {
        console.info('IMPOSSIBLE: There is no video.', video);
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
        (photo as StateImageParsedFrames).fileFrames = responseFiles;
      }
    }
  }

  return next();
};
