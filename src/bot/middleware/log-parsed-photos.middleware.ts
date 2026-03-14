import { InputFile } from 'grammy';
import { isPrivateChat } from 'grammy-guard';

import { onlyCreatorFilter } from '@bot/filters/only-creator.filter';

import type { GrammyMiddleware } from '@app-types/context';

import { environmentConfig } from '../../config';

/**
 * Logs parsed photos
 * */
export const logParsedPhotosMiddleware: GrammyMiddleware = async (context, next) => {
  const { photo, isDeleted } = context.state;
  const isValidToLog = onlyCreatorFilter(context) || (isPrivateChat(context) && environmentConfig.ENV !== 'production');

  if (isValidToLog && photo && 'fileFrames' in photo && photo.fileFrames) {
    const files = photo.fileFrames.map((frame, index) => new InputFile(frame, `${photo.meta.file_id}${index}.png`));

    await context.replyWithMediaGroup(
      files.map((file) => ({ type: 'photo', media: file, caption: 'Parsed photo gallery screenshots' })),
      { reply_to_message_id: isDeleted ? undefined : context.msg?.message_id },
    );
  }

  return next();
};
