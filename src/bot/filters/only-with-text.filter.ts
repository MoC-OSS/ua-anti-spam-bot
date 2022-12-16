import type { GrammyFilter } from '../../types';

/**
 * Checks that state has text
 * */
export const onlyWithTextFilter: GrammyFilter = (context) => !!context.state.text;
