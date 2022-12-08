import type { GrammyContext } from '../../types';

export function onlyNotDeletedFilter(context: GrammyContext): boolean {
  return !context.state.isDeleted;
}
