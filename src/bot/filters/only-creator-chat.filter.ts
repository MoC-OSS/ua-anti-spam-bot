import { creatorId } from '../../creator';
import type { GrammyFilter } from '../../types';

/**
 * @description
 * Allow actions only it bot creator chat
 * */
export const onlyCreatorChatFilter: GrammyFilter = (context) => context.chat?.id === creatorId;
