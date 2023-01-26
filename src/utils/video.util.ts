import axios from 'axios';

import { environmentConfig } from '../config';
import type { GrammyBot, GrammyContext, ImageVideoTypes } from '../types';
import { ImageType } from '../types';
import type { StateImageAnimation, StateImageVideo, StateImageVideoNote, StateImageVideoSticker, StateVideoFormats } from '../types/state';

/**
 * Helps to manage video across the bot
 * */
export class VideoUtil {
  private api!: GrammyBot['api'];

  /**
   * Way to parse video info from context
   * */
  private parsePhotoMap = new Map<ImageVideoTypes, (context: GrammyContext) => { video: StateVideoFormats; fileName: string | undefined }>([
    [
      ImageType.VIDEO,
      (context) => {
        const meta = context.state.photo as StateImageVideo;

        return {
          video: meta.video,
          fileName: meta.video.file_name,
        };
      },
    ],
    [
      ImageType.VIDEO_STICKER,
      (context) => {
        const meta = context.state.photo as StateImageVideoSticker;

        return {
          video: meta.meta,
          fileName: meta.meta.set_name,
        };
      },
    ],
    [
      ImageType.ANIMATION,
      (context) => {
        const meta = context.state.photo as StateImageAnimation;

        return {
          video: meta.animation,
          fileName: meta.animation.file_name,
        };
      },
    ],
    [
      ImageType.VIDEO_NOTE,
      (context) => {
        const meta = context.state.photo as StateImageVideoNote;

        return {
          video: meta.videoNote,
          fileName: meta.videoNote.file_unique_id,
        };
      },
    ],
  ]);

  /**
   * Init the service
   * @required
   * */
  init(api: GrammyBot['api']) {
    this.api = api;
  }

  /**
   * Checks if context has a real parsed video
   * */
  isContextWithVideo(context: GrammyContext): boolean {
    return !!this.parsePhotoMap.get(context.state.photo?.type as ImageVideoTypes);
  }

  /**
   * Downloads a video from context object
   * */
  getVideo(context: GrammyContext) {
    const { video, fileName } = this.getVideoMeta(context);

    return this.downloadVideo(video, fileName);
  }

  /**
   * Returns video meta including `video` and `fileName`
   * */
  getVideoMeta(context: GrammyContext) {
    const videoMethods = this.parsePhotoMap.get(context.state.photo?.type as ImageVideoTypes);

    if (!videoMethods) {
      throw new Error(`No method for ${context.state.photo?.type || ''}`);
    }

    return videoMethods(context);
  }

  /**
   * Downloads and returns the video
   * */
  async downloadVideo(video: StateVideoFormats, fileName: string | undefined) {
    const videoName = `${video.file_unique_id}-${fileName?.toLowerCase() || 'unknown-type.mp4'}`;
    const videoFile = await this.api.getFile(video.file_id).then((photoResponse) =>
      photoResponse.file_path
        ? axios
            .get<Buffer>(`https://api.telegram.org/file/bot${environmentConfig.BOT_TOKEN}/${photoResponse.file_path}`, {
              responseType: 'arraybuffer',
            })
            .then((response) => response.data)
        : null,
    );

    return {
      videoName,
      videoFile,
    };
  }
}

export const videoUtil = new VideoUtil();
