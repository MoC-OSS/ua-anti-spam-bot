/* eslint-disable @typescript-eslint/no-misused-promises */
import { Menu } from '@grammyjs/menu';
import { hydrateReply } from '@grammyjs/parse-mode';
import { sequentialize } from '@grammyjs/runner';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import type { Bot } from 'grammy';
import { Composer } from 'grammy';
import moment from 'moment-timezone';

import { CommandSetter } from './bot/commands';
import {
  getBeforeAnyComposer,
  getCreatorCommandsComposer,
  getHealthCheckComposer,
  getJoinLeaveComposer,
  getMessagesComposer,
  getPhotoComposer,
  getPrivateCommandsComposer,
  getPublicCommandsComposer,
  getSaveToSheetComposer,
  getTensorTrainingComposer,
} from './bot/composers';
import {
  getNoCardsComposer,
  getNoCounterOffensiveComposer,
  getNoForwardsComposer,
  getNoLocationsComposer,
  getNoMentionsComposer,
  getNoRussianComposer,
  getNoUrlsComposer,
  getNsfwFilterComposer,
  getStrategicComposer,
  getSwindlersComposer,
  getWarnRussianComposer,
} from './bot/composers/messages';
import { getSwindlersStatisticCommandsComposer } from './bot/composers/swindlers-statististics.composer';
import { isNotChannel, onlyCreatorChatFilter } from './bot/filters';
import { OnTextListener, TestTensorListener } from './bot/listeners';
import { MessageHandler } from './bot/message.handler';
import { DeleteSwindlersMiddleware, GlobalMiddleware, logCreatorState, stateMiddleware } from './bot/middleware';
import { autoThread, chainFilters, selfDestructedReply } from './bot/plugins';
import { RedisChatSession, RedisSession } from './bot/sessionProviders';
import { deleteMessageTransformer, disableLogsChatTransformer } from './bot/transformers';
import { environmentConfig } from './config';
import { logsChat, swindlerBotsChatId, swindlerHelpChatId, swindlerMessageChatId } from './creator';
import { redisClient } from './db';
import {
  alarmChatService,
  alarmService,
  CounteroffensiveService,
  initSwindlersContainer,
  redisService,
  S3Service,
  swindlersGoogleService,
} from './services';
import { initNsfwTensor, initTensor } from './tensor';
import type { GrammyContext, GrammyMenuContext } from './types';
import { emptyFunction, globalErrorHandler, videoUtil, wrapperErrorHandler } from './utils';

moment.tz.setDefault('Europe/Kiev');
moment.locale('uk');

const rootMenu = new Menu<GrammyMenuContext>('root');

/**
 * Gets main bot instance.
 * Disables redis logic if used in unit testing
 *
 * @example
 * ```ts
 * const initialBot = new Bot<GrammyContext>(environmentConfig?.BOT_TOKEN);
 * const bot = await getBot(initialBot);
 * ```
 * */
export const getBot = async (bot: Bot<GrammyContext>) => {
  if (!environmentConfig.UNIT_TESTING) {
    await redisClient.client.connect().then(() => console.info('Redis client successfully started'));
  }

  const s3Service = new S3Service();
  const tensorService = await initTensor(s3Service);
  tensorService.setSpamThreshold(await redisService.getBotTensorPercent());

  const nsfwTensorService = await initNsfwTensor();

  const { dynamicStorageService, swindlersDetectService } = await initSwindlersContainer();

  const startTime = new Date();

  if (!environmentConfig.UNIT_TESTING) {
    await alarmChatService.init(bot.api);
  }

  const airRaidAlarmStates = await alarmService.getStates();

  if (airRaidAlarmStates.states.length === 0) {
    // TODO add advance logic for this
    console.error('No states are available. Air raid feature is not working...');
    bot.api.sendMessage(logsChat, 'No states are available. Air raid feature is not working...').catch(emptyFunction);
  }

  const commandSetter = new CommandSetter(bot, startTime, !(await redisService.getIsBotDeactivated()));
  await commandSetter.updateCommands();

  const trainingThrottler = apiThrottler({
    // group: {
    //   maxConcurrent: 2,
    //   minTime: 500,
    //   reservoir: 20,
    //   reservoirRefreshAmount: 20,
    //   reservoirRefreshInterval: 10000,
    // },
  });

  const redisSession = new RedisSession();
  const redisChatSession = new RedisChatSession();

  const counteroffensiveService = new CounteroffensiveService(dynamicStorageService);

  const globalMiddleware = new GlobalMiddleware();

  const deleteSwindlersMiddleware = new DeleteSwindlersMiddleware(bot, swindlersDetectService);

  const messageHandler = new MessageHandler(tensorService);

  const onTextListener = new OnTextListener(bot, startTime, messageHandler);
  const tensorListener = new TestTensorListener(tensorService);

  // Generic composers
  const { beforeAnyComposer } = getBeforeAnyComposer();
  const { healthCheckComposer } = getHealthCheckComposer();

  // Commands
  const { publicCommandsComposer } = getPublicCommandsComposer({ rootMenu, startTime, states: airRaidAlarmStates.states });
  const { privateCommandsComposer } = getPrivateCommandsComposer({
    bot,
    commandSetter,
    dynamicStorageService,
    startTime,
    tensorService,
  });
  const { swindlersStatisticComposer } = getSwindlersStatisticCommandsComposer();
  const { creatorCommandsComposer } = getCreatorCommandsComposer({ commandSetter, rootMenu, tensorService });

  // Dev composers only
  const { saveToSheetComposer: swindlerMessageSaveToSheetComposer } = getSaveToSheetComposer({
    chatId: swindlerMessageChatId,
    rootMenu,
    updateMethod: swindlersGoogleService.appendTrainingPositives.bind(swindlersGoogleService),
  });

  const { saveToSheetComposer: swindlerBotsSaveToSheetComposer } = getSaveToSheetComposer({
    chatId: swindlerBotsChatId,
    rootMenu,
    updateMethod: swindlersGoogleService.appendBot.bind(swindlersGoogleService),
  });

  const { saveToSheetComposer: swindlerHelpSaveToSheetComposer } = getSaveToSheetComposer({
    chatId: swindlerHelpChatId,
    rootMenu,
    updateMethod: swindlersGoogleService.appendTrainingPositives.bind(swindlersGoogleService),
  });

  // Join and leave composer
  const { joinLeaveComposer } = getJoinLeaveComposer();

  // Tensor testing old logic
  const { tensorTrainingComposer } = getTensorTrainingComposer({
    tensorListener,
    trainingThrottler,
  });

  rootMenu.register(tensorListener.initMenu(trainingThrottler));

  // Message composers
  const { noCardsComposer } = getNoCardsComposer();
  const { noUrlsComposer } = getNoUrlsComposer();
  const { noRussianComposer } = getNoRussianComposer({ dynamicStorageService });
  const { warnRussianComposer } = getWarnRussianComposer({ dynamicStorageService });
  const { noLocationsComposer } = getNoLocationsComposer();
  const { noMentionsComposer } = getNoMentionsComposer();
  const { noForwardsComposer } = getNoForwardsComposer();
  const { swindlersComposer } = getSwindlersComposer({ deleteSwindlersMiddleware });
  const { strategicComposer } = getStrategicComposer({ onTextListener });
  const { noCounterOffensiveComposer } = getNoCounterOffensiveComposer();

  const { messagesComposer } = getMessagesComposer({
    counteroffensiveService,
    noCardsComposer,
    noUrlsComposer,
    noLocationsComposer,
    noMentionsComposer,
    noForwardsComposer,
    noRussianComposer,
    warnRussianComposer,
    swindlersComposer,
    strategicComposer,
    noCounterOffensiveComposer,
  });

  // Photo composers
  const { nsfwFilterComposer } = getNsfwFilterComposer({ nsfwTensorService });

  const { photosComposer } = getPhotoComposer({ nsfwFilterComposer });

  // Not channel handlers
  const notChannelRegisterComposer = new Composer<GrammyContext>();

  const notChannelComposer = notChannelRegisterComposer.filter((context) => isNotChannel(context));

  bot.use(
    sequentialize((context: GrammyContext) => {
      const chat = context.chat?.id.toString();
      const user = context.from?.id.toString();
      const array: string[] = [];
      if (chat !== undefined) {
        array.push(chat);
      }
      if (user !== undefined) {
        array.push(user);
      }
      return array;
    }),
  );

  bot.use(hydrateReply);
  bot.use(selfDestructedReply());
  bot.use(autoThread());

  bot.use(stateMiddleware);

  if (!environmentConfig.UNIT_TESTING) {
    bot.use(redisSession.middleware());
    bot.use(redisChatSession.middleware());
  }

  // Set message as deleted when deleteMessage method has been called
  bot.use((context, next) => {
    context.api.config.use(deleteMessageTransformer(context));
    return next();
  });

  if (environmentConfig.DISABLE_LOGS_CHAT) {
    bot.use((context, next) => {
      context.api.config.use(disableLogsChatTransformer);
      return next();
    });
  }

  bot.use(rootMenu as unknown as Menu<GrammyContext>);

  bot.use(wrapperErrorHandler(globalMiddleware.middleware()));

  // Generic composers
  bot.use(beforeAnyComposer);

  // Commands
  notChannelComposer.use(healthCheckComposer);
  notChannelComposer.use(creatorCommandsComposer);
  notChannelComposer.use(privateCommandsComposer);
  notChannelComposer.use(swindlersStatisticComposer);
  notChannelComposer.use(publicCommandsComposer);

  // Swindlers helpers
  notChannelComposer.use(swindlerMessageSaveToSheetComposer);
  notChannelComposer.use(swindlerBotsSaveToSheetComposer);
  notChannelComposer.use(swindlerHelpSaveToSheetComposer);

  // Join and leave composer
  notChannelComposer.use(joinLeaveComposer);

  // Tensor testing old logic
  notChannelComposer.use(tensorTrainingComposer);

  // Main message composer
  notChannelComposer.use(messagesComposer);
  notChannelComposer.use(photosComposer);

  // Log state for creator only chat
  notChannelComposer
    .filter((context) => chainFilters(onlyCreatorChatFilter, !!context.state.isDeleted || !!context.state.photo)(context))
    .use(logCreatorState);

  bot.use(notChannelRegisterComposer);

  bot.catch(globalErrorHandler);

  videoUtil.init(bot.api);

  return bot;
};
