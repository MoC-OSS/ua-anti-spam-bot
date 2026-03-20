import { creatorId } from '@bot/creator';

import type { GrammyContext } from '@app-types/context';

/**
 * Allow actions only for the bot creator.
 * @param context - The Grammy context object
 * @returns True if the sender is the bot creator, false otherwise
 */
export function onlyCreatorFilter(context: GrammyContext) {
  // eslint-disable-next-line sonarjs/different-types-comparison
  return context.from?.id === creatorId;
}
