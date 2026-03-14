import type { GrammyContext } from '@types/';

import { creatorId } from '../../creator';

/**
 * @description
 * Allow actions only for bot creator
 * */
export function onlyCreatorFilter(context: GrammyContext) {
  return context.from?.id === creatorId;
}
