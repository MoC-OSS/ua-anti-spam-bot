import { creatorId } from '@bot/creator';

import type { GrammyFilter } from '@app-types/context';

/**
 * Allow actions only in the bot creator's chat.
 * @param context - The Grammy context object
 * @returns True if the update originates from the bot creator's chat, false otherwise
 */
// eslint-disable-next-line sonarjs/different-types-comparison
export const onlyCreatorChatFilter: GrammyFilter = (context) => context.chat?.id === creatorId;
