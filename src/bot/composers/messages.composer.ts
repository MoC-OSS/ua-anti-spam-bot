import { Composer } from 'grammy';

import { messageQuery } from '../../const';
import type { GrammyContext, GrammyMiddleware } from '../../types';
import { isNotChannel, onlyNotDeletedFilter } from '../filters';
import {
  botActiveMiddleware,
  botRedisActive,
  ignoreOld,
  onlyNotAdmin,
  onlyWhenBotAdmin,
  onlyWithText,
  parseMentions,
  parseText,
  parseUrls,
  performanceEndMiddleware,
  performanceStartMiddleware,
} from '../middleware';

export interface MessagesComposerProperties {
  noUrlsComposer: Composer<GrammyContext>;
  noMentionsComposer: Composer<GrammyContext>;
  swindlersComposer: Composer<GrammyContext>;
  strategicComposer: Composer<GrammyContext>;
}

/**
 * @description Message handling composer
 * */
export const getMessagesComposer = ({
  noUrlsComposer,
  noMentionsComposer,
  strategicComposer,
  swindlersComposer,
}: MessagesComposerProperties) => {
  const messagesComposer = new Composer<GrammyContext>();

  /**
   * Only these messages will be processed in this composer
   * */
  const readyMessagesComposer = messagesComposer
    // Queries to follow
    .on(messageQuery)
    // Filtering messages from channel
    .filter((context) => isNotChannel(context))
    // Filtering messages
    .use(botRedisActive, ignoreOld(60), botActiveMiddleware, onlyNotAdmin, onlyWhenBotAdmin)
    // Parse message text and add it to state
    .use(parseText, onlyWithText)
    // Handle performance start
    .use(performanceStartMiddleware);

  /**
   * Registers a message handler module with correct filter to not make extra checks
   * */
  const registerModule = (middleware: Composer<GrammyContext> | GrammyMiddleware) => {
    readyMessagesComposer.filter((context) => onlyNotDeletedFilter(context)).use(middleware);
  };

  /**
   * Register modules.
   * The order should be right
   * */
  registerModule(parseUrls);
  registerModule(noUrlsComposer);
  registerModule(parseMentions);
  registerModule(noMentionsComposer);
  registerModule(swindlersComposer);
  registerModule(strategicComposer);

  readyMessagesComposer.use(performanceEndMiddleware);

  return { messagesComposer };
};
