import type * as Buffer from 'node:buffer';
import axios from 'axios';
import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { environmentConfig } from '../../config';

/**
 * @description
 * Add images into state.
 * Downloads the smallest one and appends into the state.
 * */
export async function parsePhotos(context: GrammyContext, next: NextFunction) {
  if (!context.state.photo && context.state.photo !== null) {
    const photosMeta = context.msg?.photo;

    if (photosMeta) {
      // Get the smallest size picture
      const photoMeta = photosMeta[0];
      const photoFile = await context.api.getFile(photoMeta.file_id).then((photoResponse) =>
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
            meta: photoMeta,
            file: photoFile,
          }
        : null;
    } else {
      context.state.photo = null;
    }
  }

  return next();
}
