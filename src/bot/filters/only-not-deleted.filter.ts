import type { GrammyContext } from '@app-types/context';

/**
 * Checks that the message has not already been deleted by a previous middleware.
 * @param context - The Grammy context object
 * @returns `true` when the message is still present (not deleted).
 */
export function onlyNotDeletedFilter(context: GrammyContext): boolean {
  return !context.state.isDeleted;
}
