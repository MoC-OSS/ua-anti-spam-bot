import type { NextFunction } from 'grammy';

import { spamMediaGroupsStorage } from '@services/spam-media-groups-storage.service';

import type { GrammyContext } from '@app-types/context';

/**
 * saveSpamMediaGroup middleware.
 * If the message is part of a media group and has been deleted, then caches spam media group id.
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export async function saveSpamMediaGroupMiddleware(context: GrammyContext, next: NextFunction) {
  const isMediaGroup = context.message?.media_group_id;
  const { isDeleted } = context.state;

  if (isMediaGroup && isDeleted) {
    spamMediaGroupsStorage.addSpamMediaGroup(context);
  }

  return next();
}
