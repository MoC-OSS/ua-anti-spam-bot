import type { NextFunction } from 'grammy';

import { spamMediaGroupsStorage } from '../../services';
import type { GrammyContext } from '../../types';

/**
 * deleteSpamMediaGroup middleware
 *
 * If the message is part of a media group and the media group is spam,
 * then delete this message.
 * */
export async function deleteSpamMediaGroupMiddleware(context: GrammyContext, next: NextFunction) {
  const isMediaGroup = context.message?.media_group_id;
  const { isDeleted } = context.state;
  const isSpam = spamMediaGroupsStorage.isSpamMediaGroup(context);

  if (isMediaGroup && !isDeleted && isSpam) {
    await context.deleteMessage();
  }

  return next();
}
