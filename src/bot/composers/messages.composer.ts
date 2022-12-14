import { Composer } from 'grammy';

import { messageQuery } from '../../const';
import type { DefaultChatSettings, GrammyContext, GrammyMiddleware, OptionalChatSettings } from '../../types';
import { onlyActiveDefaultSettingFilter, onlyActiveOptionalSettingFilter, onlyNotDeletedFilter } from '../filters';
import {
  botActiveMiddleware,
  botRedisActive,
  ignoreOld,
  logContextMiddleware,
  onlyNotAdmin,
  onlyWhenBotAdmin,
  onlyWithText,
  parseCards,
  parseLocations,
  parseMentions,
  parseText,
  parseUrls,
  performanceEndMiddleware,
  performanceStartMiddleware,
} from '../middleware';

export interface MessagesComposerProperties {
  noCardsComposer: Composer<GrammyContext>;
  noUrlsComposer: Composer<GrammyContext>;
  noLocationsComposer: Composer<GrammyContext>;
  noMentionsComposer: Composer<GrammyContext>;
  noForwardsComposer: Composer<GrammyContext>;
  swindlersComposer: Composer<GrammyContext>;
  strategicComposer: Composer<GrammyContext>;
}

/**
 * @description Message handling composer
 * */
export const getMessagesComposer = ({
  noCardsComposer,
  noUrlsComposer,
  noLocationsComposer,
  noMentionsComposer,
  noForwardsComposer,
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
    // Filtering messages
    .use(botRedisActive, ignoreOld(60), botActiveMiddleware, onlyNotAdmin, onlyWhenBotAdmin)
    // Parse message text and add it to state
    .use(parseText, onlyWithText)
    // Handle performance start
    .use(performanceStartMiddleware);

  /**
   * Registers a message handler module with correct filter to not make extra checks
   * */
  const registerModule = (...middlewares: (Composer<GrammyContext> | GrammyMiddleware)[]) => {
    readyMessagesComposer.filter((context) => onlyNotDeletedFilter(context)).use(...middlewares);
  };

  /**
   * Register a module that will be called only if optional settings is enabled
   * */
  const registerDefaultSettingModule = (key: keyof DefaultChatSettings, ...middlewares: (Composer<GrammyContext> | GrammyMiddleware)[]) => {
    readyMessagesComposer
      .filter((context) => onlyNotDeletedFilter(context))
      .filter((context) => onlyActiveDefaultSettingFilter(key)(context))
      .use(...middlewares);
  };

  /**
   * Register a module that will be called only if optional settings is enabled
   * */
  const registerOptionalSettingModule = (
    key: keyof OptionalChatSettings,
    ...middlewares: (Composer<GrammyContext> | GrammyMiddleware)[]
  ) => {
    readyMessagesComposer
      .filter((context) => onlyNotDeletedFilter(context))
      .filter((context) => onlyActiveOptionalSettingFilter(key)(context))
      .use(...middlewares);
  };

  /**
   * Register modules.
   * The order should be right
   * */
  registerDefaultSettingModule('disableSwindlerMessage', swindlersComposer);
  registerOptionalSettingModule('enableDeleteUrls', parseUrls, noUrlsComposer);
  registerOptionalSettingModule('enableDeleteLocations', parseLocations, noLocationsComposer);
  registerOptionalSettingModule('enableDeleteMentions', parseMentions, noMentionsComposer);
  registerOptionalSettingModule('enableDeleteCards', parseCards, noCardsComposer);
  registerOptionalSettingModule('enableDeleteForwards', noForwardsComposer);
  registerModule(strategicComposer);

  readyMessagesComposer.use(performanceEndMiddleware);
  readyMessagesComposer.use(logContextMiddleware);

  return { messagesComposer };
};
