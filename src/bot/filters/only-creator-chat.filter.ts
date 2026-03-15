import { creatorId } from '@bot/creator';

import type { GrammyFilter } from '@app-types/context';

/**
 * @description
 * Allow actions only it bot creator chat
 * */
// eslint-disable-next-line sonarjs/different-types-comparison
export const onlyCreatorChatFilter: GrammyFilter = (context) => context.chat?.id === creatorId;
