import type { NextFunction } from 'grammy';

import { spamMediaGroupsStorage } from '@services/spam-media-groups-storage.service';

import type { GrammyContext } from '@app-types/context';

/**
 * deleteSpamMediaGroup middleware
 *
 * If the message is part of a media group and the media group is spam,
 * then delete this message.
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export async function deleteSpamMediaGroupMiddleware(context: GrammyContext, next: NextFunction) {
  const isMediaGroup = context.message?.media_group_id;

  if (!isMediaGroup) {
    return next();
  }

  const { isDeleted } = context.state;
  const isSpam = spamMediaGroupsStorage.isSpamMediaGroup(context);

  if (isMediaGroup && !isDeleted && isSpam) {
    await context.deleteMessage();
  }

  return next();
}
