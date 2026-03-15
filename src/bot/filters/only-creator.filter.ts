import { creatorId } from '@bot/creator';

import type { GrammyContext } from '@app-types/context';

/**
 * @description
 * Allow actions only for bot creator
 * */
export function onlyCreatorFilter(context: GrammyContext) {
  // eslint-disable-next-line sonarjs/different-types-comparison
  return context.from?.id === creatorId;
}
