import type { GrammyFilter } from '@app-types/context';

/**
 * Checks that state has text.
 * @param context - The Grammy context object
 * @returns True if the context state contains text, false otherwise
 */
export const onlyWithTextFilter: GrammyFilter = (context) => !!context.state.text;
