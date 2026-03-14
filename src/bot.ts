import { Menu } from '@grammyjs/menu';
import { sequentialize } from '@grammyjs/runner';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import type { Bot } from 'grammy';
import { Composer } from 'grammy';

import moment from 'moment-timezone';

import { CommandSetter } from './bot/commands/command-setter';
import { getBeforeAnyComposer } from './bot/composers/before-any.composer';
import { getCreateLogsChatComposer } from './bot/composers/create-logs-chat.composer';
import { getCreatorCommandsComposer } from './bot/composers/creator-command.composer';
import { getHealthCheckComposer } from './bot/composers/health-check.composer';
import { getHotlineSecurityComposer } from './bot/composers/hotline-security.composer';
import { getJoinLeaveComposer } from './bot/composers/join-leave.composer';
import { getMessagesComposer } from './bot/composers/messages.composer';
import { getDenylistComposer } from './bot/composers/messages/denylist.composer';
import { getNoAntisemitismComposer } from './bot/composers/messages/no-antisemitism.composer';
import { getNoCardsComposer } from './bot/composers/messages/no-cards.composer';
import { getNoChannelMessagesComposer } from './bot/composers/messages/no-channel-messages.composer';
import { getNoCounterOffensiveComposer } from './bot/composers/messages/no-counteroffensive.composer';
import { getNoForwardsComposer } from './bot/composers/messages/no-forward.composer';
import { getNoLocationsComposer } from './bot/composers/messages/no-locations.composer';
import { getNoMentionsComposer } from './bot/composers/messages/no-mentions.composer';
import { getNoObsceneComposer } from './bot/composers/messages/no-obscene.composer';
import { getNoRussianComposer } from './bot/composers/messages/no-russian.composer';
import { getNoUrlsComposer } from './bot/composers/messages/no-urls.composer';
import { getNsfwFilterComposer } from './bot/composers/messages/nsfw-filter.composer';
import { getNsfwMessageFilterComposer } from './bot/composers/messages/nsfw-message-filter.composer';
import { getStrategicComposer } from './bot/composers/messages/strategic.composer';
import { getSwindlersComposer } from './bot/composers/messages/swindlers.composer';
import { getWarnObsceneComposer } from './bot/composers/messages/warn-obscene.composer';
import { getWarnRussianComposer } from './bot/composers/messages/warn-russian.composer';
import { getPhotoComposer } from './bot/composers/photos.composer';
import { getPrivateCommandsComposer } from './bot/composers/private-command.composer';
import { getPublicCommandsComposer } from './bot/composers/public-command.composer';
import { getSaveToSheetComposer } from './bot/composers/save-to-sheet.composer';
import { getSwindlersStatisticCommandsComposer } from './bot/composers/swindlers-statististics.composer';
import { getTensorTrainingComposer } from './bot/composers/tensor-training.composer';
import { isNotChannel } from './bot/filters/is-not-channel.filter';
import { onlyCreatorChatFilter } from './bot/filters/only-creator-chat.filter';
import { OnTextListener } from './bot/listeners/on-text.listener';
import { TestTensorListener } from './bot/listeners/test-tensor.listener';
import { MessageHandler } from './bot/message.handler';
import { adminCheckNotify } from './bot/middleware/admin-check-notify.middleware';
import { deleteSpamMediaGroupMiddleware } from './bot/middleware/delete-spam-media-groups.middleware';
import { DeleteSwindlersMiddleware } from './bot/middleware/delete-swindlers.middleware';
import { GlobalMiddleware } from './bot/middleware/global.middleware';
import { logCreatorState } from './bot/middleware/log-creator-state.middleware';
import { stateMiddleware } from './bot/middleware/state.middleware';
import { autoCommentReply } from './bot/plugins/auto-comment-reply.plugin';
import { chainFilters } from './bot/plugins/chain-filters.plugin';
import { selfDestructedReply } from './bot/plugins/self-destructed.plugin';
import { RedisChatSession } from './bot/sessionProviders/redis-chat-session-storage';
import { RedisSession } from './bot/sessionProviders/redis-session-storage';
import { deleteMessageTransformer } from './bot/transformers/delete-message.transformer';
import { disableLogsChatTransformer } from './bot/transformers/disable-logs-chat.transformer';
import * as redisClient from './db/redis';
import { alarmService } from './services/alarm.service';
import { alarmChatService } from './services/alarm-chat.service';
import { CounteroffensiveService } from './services/counteroffensive.service';
import { NsfwDetectService } from './services/nsfw-detect.service';
import { redisService } from './services/redis.service';
import { S3Service } from './services/s3.service';
import { initSwindlersContainer } from './services/swindlers.container';
import { swindlersGoogleService } from './services/swindlers-google.service';
import { initNsfwTensor } from './tensor/nsfw-tensor.service';
import { initTensor } from './tensor/tensor.service';
import type { GrammyContext, GrammyMenuContext } from './types/context';
import { globalErrorHandler, wrapperErrorHandler } from './utils/error-handler';
import { videoUtility } from './utils/video.util';
import { environmentConfig } from './config';
import { swindlerBotsChatId, swindlerHelpChatId, swindlerMessageChatId } from './creator';

moment.tz.setDefault('Europe/Kiev');
moment.locale('uk');

const rootMenu = new Menu<GrammyMenuContext>('root');

// eslint-disable-next-line no-secrets/no-secrets
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
    // console.error('No states are available. Air raid feature is not working...');
    // bot.api.sendMessage(logsChat, 'No states are available. Air raid feature is not working...').catch(emptyFunction);
  }

  const commandSetter = new CommandSetter(bot, startTime, !(await redisService.getIsBotDeactivated()));

  if (!environmentConfig.UNIT_TESTING) {
    await commandSetter.updateCommands();
  }

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
  const nsfwDetectService = new NsfwDetectService(dynamicStorageService, 0.6);

  const globalMiddleware = new GlobalMiddleware();

  const deleteSwindlersMiddleware = new DeleteSwindlersMiddleware(bot, swindlersDetectService);

  const messageHandler = new MessageHandler(tensorService);

  const onTextListener = new OnTextListener(bot, startTime, messageHandler);
  const tensorListener = new TestTensorListener(tensorService);

  // Generic composers
  const { beforeAnyComposer } = getBeforeAnyComposer();
  const { healthCheckComposer } = getHealthCheckComposer();
  const { hotlineSecurityComposer } = getHotlineSecurityComposer();
  const { createLogsChatComposer } = getCreateLogsChatComposer();

  // Commands
  const { publicCommandsComposer } = getPublicCommandsComposer({ startTime });

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
  const { noObsceneComposer } = getNoObsceneComposer();
  const { warnObsceneComposer } = getWarnObsceneComposer();
  const { noAntisemitismComposer } = getNoAntisemitismComposer();
  const { noChannelMessagesComposer } = getNoChannelMessagesComposer();
  const { nsfwMessageFilterComposer } = getNsfwMessageFilterComposer({ nsfwDetectService });
  const { denylistComposer } = getDenylistComposer();

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
    noObsceneComposer,
    warnObsceneComposer,
    noAntisemitismComposer,
    noChannelMessagesComposer,
    nsfwMessageFilterComposer,
    denylistComposer,
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

  bot.use(selfDestructedReply());
  bot.use(autoCommentReply());

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

  // Generic non-channel composer
  notChannelComposer.use(deleteSpamMediaGroupMiddleware);

  // Commands
  notChannelComposer.use(healthCheckComposer);
  notChannelComposer.use(hotlineSecurityComposer);
  notChannelComposer.use(createLogsChatComposer);
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
  notChannelComposer.use(adminCheckNotify);

  // Log state for creator only chat
  notChannelComposer
    .filter((context) => chainFilters(onlyCreatorChatFilter, !!context.state.isDeleted || !!context.state.photo)(context))
    .use(logCreatorState);

  bot.use(notChannelRegisterComposer);

  bot.catch(globalErrorHandler);

  videoUtility.init(bot.api);

  return bot;
};
