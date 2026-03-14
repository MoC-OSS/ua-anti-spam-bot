import type { GrammyContext } from '@app-types/context';

export function onlyNotDeletedFilter(context: GrammyContext): boolean {
  return !context.state.isDeleted;
}
