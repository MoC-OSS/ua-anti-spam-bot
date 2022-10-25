import { creatorId } from '../../creator';
import type { GrammyContext } from '../../types';

/**
 * @description
 * Allow actions only for bot creator
 * */
export function onlyCreatorFilter(context: GrammyContext) {
  return context.from?.id === creatorId;
}
