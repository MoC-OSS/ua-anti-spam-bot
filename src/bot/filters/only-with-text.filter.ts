import type { GrammyFilter } from '@app-types/context';

/**
 * Checks that state has text
 * @param context
 */
export const onlyWithTextFilter: GrammyFilter = (context) => !!context.state.text;
