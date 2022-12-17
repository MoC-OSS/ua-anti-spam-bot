import type * as Buffer from 'node:buffer';
import axios from 'axios';
import type { NextFunction } from 'grammy';
import sharp from 'sharp';
import type { GrammyContext } from 'types';

import { environmentConfig } from '../../config';

/**
 * @description
 * Add images into state.
 * Downloads the smallest one and appends into the state.
 * */
export async function parsePhoto(context: GrammyContext, next: NextFunction) {
  if (!context.state.photo && context.state.photo !== null) {
    const photo = context.msg?.photo;
    const sticker = context.msg?.sticker;

    // Get the largest size picture
    const photoMeta = photo?.[2];
    // Leaving only a regular sticker, not video and not animated
    const stickerMeta = sticker && !sticker.is_video && !sticker.is_animated ? sticker : null;

    const imageMeta = photoMeta || stickerMeta;

    if (imageMeta) {
      const photoFile = await context.api.getFile(imageMeta.file_id).then((photoResponse) =>
        photoResponse.file_path
          ? axios
              .get<Buffer>(`https://api.telegram.org/file/bot${environmentConfig.BOT_TOKEN}/${photoResponse.file_path}`, {
                responseType: 'arraybuffer',
              })
              .then((response) => response.data)
          : null,
      );

      context.state.photo = photoFile
        ? {
            meta: imageMeta,
            file: await sharp(photoFile).jpeg().toBuffer(),
          }
        : null;
    } else {
      context.state.photo = null;
    }
  }

  return next();
}
