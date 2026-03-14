import type { GrammyFilter } from '@types/';

import { creatorId } from '../../creator';

/**
 * @description
 * Allow actions only it bot creator chat
 * */
export const onlyCreatorChatFilter: GrammyFilter = (context) => context.chat?.id === creatorId;
