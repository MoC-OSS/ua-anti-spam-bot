import { Composer } from 'grammy';

import { messageQuery } from '../../const';
import type { CounteroffensiveService } from '../../services';
import type { DefaultChatSettings, GrammyContext, GrammyMiddleware, OptionalChatSettings } from '../../types';
import { onlyActiveDefaultSettingFilter, onlyActiveOptionalSettingFilter, onlyNotDeletedFilter, onlyWithTextFilter } from '../filters';
import {
  botActiveMiddleware,
  botRedisActive,
  ignoreOld,
  logContextMiddleware,
  onlyNotAdmin,
  onlyWhenBotAdmin,
  parseCards,
  parseEntities,
  parseIsCounteroffensive,
  parseIsRussian,
  parseLocations,
  parseMentions,
  parseText,
  parseUrls,
  performanceEndMiddleware,
  performanceStartMiddleware,
  saveSpamMediaGroupMiddleware,
} from '../middleware';

export interface MessagesComposerProperties {
  counteroffensiveService: CounteroffensiveService;
  noCardsComposer: Composer<GrammyContext>;
  noUrlsComposer: Composer<GrammyContext>;
  noLocationsComposer: Composer<GrammyContext>;
  noMentionsComposer: Composer<GrammyContext>;
  noForwardsComposer: Composer<GrammyContext>;
  swindlersComposer: Composer<GrammyContext>;
  strategicComposer: Composer<GrammyContext>;
  noRussianComposer: Composer<GrammyContext>;
  warnRussianComposer: Composer<GrammyContext>;
  noCounterOffensiveComposer: Composer<GrammyContext>;
  noObsceneComposer: Composer<GrammyContext>;
  warnObsceneComposer: Composer<GrammyContext>;
  noAntisemitismComposer: Composer<GrammyContext>;
  noChannelMessagesComposer: Composer<GrammyContext>;
  nsfwMessageFilterComposer: Composer<GrammyContext>;
  denylistComposer: Composer<GrammyContext>;
}

/**
 * Returns an object containing message handler registration functions and Composer instances.
 * Use it to add features on it
 */
export const getMessagesRegisterComposer = () => {
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
    .use(parseText)
    // Filter updates if there are no text
    .filter((context) => onlyWithTextFilter(context))
    // Handle performance start
    .use(performanceStartMiddleware, parseEntities);

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

  return { messagesComposer, readyMessagesComposer, registerModule, registerDefaultSettingModule, registerOptionalSettingModule };
};

/**
 * @description Message handling composer
 * */
export const getMessagesComposer = ({
  counteroffensiveService,
  noCardsComposer,
  noUrlsComposer,
  noLocationsComposer,
  noMentionsComposer,
  noForwardsComposer,
  strategicComposer,
  swindlersComposer,
  noRussianComposer,
  warnRussianComposer,
  noCounterOffensiveComposer,
  noObsceneComposer,
  warnObsceneComposer,
  noAntisemitismComposer,
  noChannelMessagesComposer,
  nsfwMessageFilterComposer,
  denylistComposer,
}: MessagesComposerProperties) => {
  const { messagesComposer, readyMessagesComposer, registerDefaultSettingModule, registerOptionalSettingModule } =
    getMessagesRegisterComposer();

  /**
   * Register modules.
   * The order should be right
   * */
  registerDefaultSettingModule('disableDeleteAntisemitism', noAntisemitismComposer);
  registerDefaultSettingModule('disableNsfwFilter', nsfwMessageFilterComposer);
  registerDefaultSettingModule('disableSwindlerMessage', swindlersComposer);
  registerOptionalSettingModule(
    'enableDeleteCounteroffensive',
    parseIsCounteroffensive(counteroffensiveService),
    noCounterOffensiveComposer,
  );
  registerOptionalSettingModule('enableDeleteUrls', parseUrls, noUrlsComposer);
  registerOptionalSettingModule('enableDeleteLocations', parseLocations, noLocationsComposer);
  registerOptionalSettingModule('enableDeleteMentions', parseMentions, noMentionsComposer);
  registerOptionalSettingModule('enableDeleteCards', parseCards, noCardsComposer);
  registerOptionalSettingModule('enableDeleteForwards', noForwardsComposer);
  registerOptionalSettingModule('enableDeleteRussian', parseIsRussian, noRussianComposer);
  registerOptionalSettingModule('enableWarnRussian', parseIsRussian, warnRussianComposer);
  registerOptionalSettingModule('enableDeleteObscene', noObsceneComposer);
  registerOptionalSettingModule('enableWarnObscene', warnObsceneComposer);
  registerOptionalSettingModule('enableDeleteChannelMessages', noChannelMessagesComposer);
  registerOptionalSettingModule('enableDeleteDenylist', denylistComposer);
  // TODO optimize this module
  registerDefaultSettingModule('disableStrategicInfo', strategicComposer);

  readyMessagesComposer.use(saveSpamMediaGroupMiddleware);
  readyMessagesComposer.use(performanceEndMiddleware);
  readyMessagesComposer.use(logContextMiddleware);

  return { messagesComposer };
};
