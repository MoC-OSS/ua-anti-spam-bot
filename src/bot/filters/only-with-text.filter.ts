import type { GrammyFilter } from '@app-types/context';

/**
 * Checks that state has text
 * */
export const onlyWithTextFilter: GrammyFilter = (context) => !!context.state.text;
