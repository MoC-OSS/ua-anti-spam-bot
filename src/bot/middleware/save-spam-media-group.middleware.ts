import type { NextFunction } from 'grammy';

import { spamMediaGroupsStorage } from '../../services';
import type { GrammyContext } from '../../types';

/**
 * saveSpamMediaGroup middleware.
 *
 * If the message is part of a media group and has been deleted,
 * then caches spam media group id.
 * */
export async function saveSpamMediaGroupMiddleware(context: GrammyContext, next: NextFunction) {
  const isMediaGroup = context.message?.media_group_id;
  const { isDeleted } = context.state;

  if (isMediaGroup && isDeleted) {
    spamMediaGroupsStorage.addSpamMediaGroup(context);
  }

  return next();
}
