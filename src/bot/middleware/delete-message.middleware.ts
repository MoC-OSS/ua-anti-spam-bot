import type { NextFunction } from 'grammy';

import type { GrammyContext } from '../../types';

/**
 * Delete user entered message
 *
 * @param {GrammyContext} GrammyContext
 * @param {NextFunction} next
 * */
export function deleteMessageMiddleware(context: GrammyContext, next: NextFunction) {
  return context
    .deleteMessage()
    .then(next)
    .catch(() => {});
}
