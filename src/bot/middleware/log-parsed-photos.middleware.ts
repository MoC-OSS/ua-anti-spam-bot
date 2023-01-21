import { InputFile } from 'grammy';
import { isPrivate } from 'grammy-guard';

import { environmentConfig } from '../../config';
import type { GrammyMiddleware } from '../../types';
import { onlyCreatorFilter } from '../filters';

/**
 * Logs parsed photos
 * */
export const logParsedPhotosMiddleware: GrammyMiddleware = async (context, next) => {
  const { photo, isDeleted } = context.state;
  const isValidToLog = onlyCreatorFilter(context) || (isPrivate(context) && environmentConfig.ENV !== 'production');

  if (isValidToLog && photo && 'fileFrames' in photo && photo.fileFrames) {
    const files = photo.fileFrames.map((frame, index) => new InputFile(frame, `${photo.meta.file_id}${index}.png`));

    await context.replyWithMediaGroup(
      files.map((file) => ({ type: 'photo', media: file, caption: 'test' })),
      { reply_to_message_id: isDeleted ? undefined : context.msg?.message_id },
    );
  }

  return next();
};
