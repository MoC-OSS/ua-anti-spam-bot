import { isChannel } from 'grammy-guard';

import type { GrammyFilter } from '@app-types/context';

/**
 * Checks that the update did not originate from a channel.
 * @returns `true` when the context is NOT a channel update.
 */
export const isNotChannel: GrammyFilter = (context) => !isChannel(context);
