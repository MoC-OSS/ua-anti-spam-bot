import type * as Buffer from 'node:buffer';
import axios from 'axios';
import type { NextFunction } from 'grammy';
import sharp from 'sharp';

import { environmentConfig } from '../../config';
import type { GrammyContext } from '../../types';
import { ImageType } from '../../types';
import type { StateImage } from '../../types/state';

/**
 * @description
 * Add images into state.
 * Downloads the smallest one and appends into the state.
 * */
export async function parsePhoto(context: GrammyContext, next: NextFunction) {
  if (!context.state.photo && context.state.photo !== null) {
    const photo = context.msg?.photo;
    const sticker = context.msg?.sticker;
    const video = context.msg?.video;
    const animation = context.msg?.animation;
    const videoNote = context.msg?.video_note;

    // Get the largest size picture
    const photoMeta = photo?.[2];
    // Leaving only a regular sticker, not video and not animated
    const stickerMeta = sticker && !sticker.is_video && !sticker.is_animated ? sticker : null;
    // Video and animated stickers
    const videoStickerMeta = sticker && sticker.is_video && !sticker.is_animated ? sticker : null;
    // Check only video thumb
    const videoMeta = (video || videoStickerMeta)?.thumb;
    // GIFs
    const animationMeta = animation && animation.thumb;
    // Round video messages
    const videoNoteMeta = videoNote && videoNote.thumb;

    const imageMeta = photoMeta || stickerMeta || videoStickerMeta || videoMeta || animationMeta || videoNoteMeta;
    let imageType: ImageType = ImageType.UNKNOWN;

    if (photoMeta) {
      imageType = ImageType.PHOTO;
    } else if (stickerMeta) {
      imageType = ImageType.STICKER;
    } else if (videoStickerMeta) {
      imageType = ImageType.VIDEO_STICKER;
    } else if (videoMeta) {
      imageType = ImageType.VIDEO;
    } else if (animation || animationMeta) {
      imageType = ImageType.ANIMATION;
    } else if (videoNote || videoNoteMeta) {
      imageType = ImageType.VIDEO_NOTE;
    }

    const photoFile = imageMeta
      ? await context.api.getFile(videoStickerMeta?.thumb?.file_id || imageMeta.file_id).then((photoResponse) =>
          photoResponse.file_path
            ? axios
                .get<Buffer>(`https://api.telegram.org/file/bot${environmentConfig.BOT_TOKEN}/${photoResponse.file_path}`, {
                  responseType: 'arraybuffer',
                })
                .then((response) => response.data)
            : null,
        )
      : null;

    context.state.photo = {
      meta: imageMeta,
      type: imageType,
      file: photoFile ? await sharp(photoFile).jpeg().toBuffer() : null,
      thumb: videoStickerMeta?.thumb,
      caption: context.msg?.caption,
      videoNote,
      video,
      animation,
    } as StateImage;
  }

  return next();
}
