import { Composer } from 'grammy';

import type { GrammyContext } from '../../types';
import { onlyNotDeletedFilter } from '../filters/only-not-deleted.filter';
import {
  botActiveMiddleware,
  botRedisActive,
  ignoreOld,
  onlyNotAdmin,
  onlyWhenBotAdmin,
  onlyWithText,
  parseText,
  performanceEndMiddleware,
  performanceStartMiddleware,
} from '../middleware';

export interface MessagesComposerProperties {
  swindlersComposer: Composer<GrammyContext>;
  strategicComposer: Composer<GrammyContext>;
}

/**
 * @description Message handling composer
 * */
export const getMessagesComposer = ({ strategicComposer, swindlersComposer }: MessagesComposerProperties) => {
  const messagesComposer = new Composer<GrammyContext>();

  /**
   * Only these messages will be processed in this composer
   * */
  const readyMessagesComposer = messagesComposer
    // Queries to follow
    .on(['message:text', 'edited_message:text', 'message:poll'])
    // Filtering messages
    .use(botRedisActive, ignoreOld(60), botActiveMiddleware, onlyNotAdmin, onlyWhenBotAdmin)
    // Parse message text and add it to state
    .use(parseText, onlyWithText)
    // Handle performance start
    .use(performanceStartMiddleware);

  /**
   * Registers a message handler module with correct filter to not make extra checks
   * */
  const registerModule = (composer: Composer<GrammyContext>) => {
    readyMessagesComposer.filter((context) => onlyNotDeletedFilter(context)).use(composer);
  };

  /**
   * Register modules.
   * The order should be right
   * */
  registerModule(swindlersComposer);
  registerModule(strategicComposer);

  readyMessagesComposer.use(performanceEndMiddleware);

  return { messagesComposer };
};
