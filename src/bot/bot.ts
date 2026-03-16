/**
 * @module bot
 * @description Core bot assembly module. Initializes all services, creates composers/middleware,
 * and registers them on the bot instance in the correct order.
 *
 * **Middleware registration order:**
 *
 * 1. `sequentialize()` — Prevent concurrent updates per user/chat
 * 2. `selfDestructedReply()` — Plugin: auto-delete bot replies after timeout
 * 3. `autoCommentReply()` — Plugin: auto-reply to linked channel comments
 * 4. `i18n` — Internationalization middleware (Ukrainian default)
 * 5. `stateMiddleware` — Initialize `context.state` for message processing
 * 6. `redisSession` / `redisChatSession` — Session persistence (disabled in tests)
 * 7. `deleteMessageTransformer` — API transformer to track deleted messages
 * 8. disable-logs-chat transformer — Suppress logs chat messages (when configured)
 * 9. `rootMenu` — grammyjs Menu plugin for inline keyboards
 * 10. `globalMiddleware` — Update session defaults and chat info
 * 11. `beforeAnyComposer` — Pre-processing for all updates
 * 12. **notChannelComposer** (filtered: non-channel updates only):
 *     - `deleteSpamMediaGroupMiddleware` — Batch-delete spam media groups
 *     - Command composers (health, hotline, logs, creator, private, public)
 *     - Swindler save-to-sheet composers
 *     - `joinLeaveComposer` — Handle member join/leave events
 *     - `tensorTrainingComposer` — Tensor model training interface
 *     - `messagesComposer` — Main message filtering pipeline
 *     - `photosComposer` — Photo/NSFW filtering
 *     - `adminCheckNotify` — Notify admins of bot status
 *     - `logCreatorState` — Debug logging for creator chat
 * 13. `globalErrorHandler` — Catch-all error boundary
 */

import { Menu } from '@grammyjs/menu';
import { sequentialize } from '@grammyjs/runner';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import type { Bot } from 'grammy';
import { Composer } from 'grammy';

import moment from 'moment-timezone';

import * as redisClient from '@db/redis.client';

import { alarmService } from '@services/alarm.service';
import { alarmChatService } from '@services/alarm-chat.service';
import { CounteroffensiveService } from '@services/counteroffensive.service';
import { NsfwDetectService } from '@services/nsfw-detect.service';
import { redisService } from '@services/redis.service';
import { S3Service } from '@services/s3.service';
import { initSwindlersContainer } from '@services/swindlers.container';
import { swindlersGoogleService } from '@services/swindlers-google.service';

import { environmentConfig } from '@shared/config';

import { initNsfwTensor } from '@tensor/nsfw-tensor.service';
import { initTensor } from '@tensor/tensor.service';

import type { GrammyContext, GrammyMenuContext } from '@app-types/context';

import { globalErrorHandler, wrapperErrorHandler } from '@utils/error-handler.util';
import { logger } from '@utils/logger.util';
import { videoUtility } from '@utils/video.util';

import { CommandSetter } from './commands/command-setter';
import { getBeforeAnyComposer } from './composers/before-any.composer';
import { getCreateLogsChatComposer } from './composers/create-logs-chat.composer';
import { getCreatorCommandsComposer } from './composers/creator-command.composer';
import { getHealthCheckComposer } from './composers/health-check.composer';
import { getHotlineSecurityComposer } from './composers/hotline-security.composer';
import { getJoinLeaveComposer } from './composers/join-leave.composer';
import { getMessagesComposer } from './composers/messages.composer';
import { getDenylistComposer } from './composers/messages/denylist.composer';
import { getNoAntisemitismComposer } from './composers/messages/no-antisemitism.composer';
import { getNoCardsComposer } from './composers/messages/no-cards.composer';
import { getNoChannelMessagesComposer } from './composers/messages/no-channel-messages.composer';
import { getNoCounterOffensiveComposer } from './composers/messages/no-counteroffensive.composer';
import { getNoForwardsComposer } from './composers/messages/no-forward.composer';
import { getNoLocationsComposer } from './composers/messages/no-locations.composer';
import { getNoMentionsComposer } from './composers/messages/no-mentions.composer';
import { getNoObsceneComposer } from './composers/messages/no-obscene.composer';
import { getNoRussianComposer } from './composers/messages/no-russian.composer';
import { getNoUrlsComposer } from './composers/messages/no-urls.composer';
import { getNsfwFilterComposer } from './composers/messages/nsfw-filter.composer';
import { getNsfwMessageFilterComposer } from './composers/messages/nsfw-message-filter.composer';
import { getStrategicComposer } from './composers/messages/strategic.composer';
import { getSwindlersComposer } from './composers/messages/swindlers.composer';
import { getWarnObsceneComposer } from './composers/messages/warn-obscene.composer';
import { getWarnRussianComposer } from './composers/messages/warn-russian.composer';
import { getPhotoComposer } from './composers/photos.composer';
import { getPrivateCommandsComposer } from './composers/private-command.composer';
import { getPublicCommandsComposer } from './composers/public-command.composer';
import { getSaveToSheetComposer } from './composers/save-to-sheet.composer';
import { getSwindlersStatisticCommandsComposer } from './composers/swindlers-statististics.composer';
import { getTensorTrainingComposer } from './composers/tensor-training.composer';
import { isNotChannel } from './filters/is-not-channel.filter';
import { onlyCreatorChatFilter } from './filters/only-creator-chat.filter';
import { MessageHandler } from './handlers/message.handler';
import { OnTextListener } from './listeners/on-text.listener';
import { TestTensorListener } from './listeners/test-tensor.listener';
import { adminCheckNotify } from './middleware/admin-check-notify.middleware';
import { deleteSpamMediaGroupMiddleware } from './middleware/delete-spam-media-groups.middleware';
import { DeleteSwindlersMiddleware } from './middleware/delete-swindlers.middleware';
import { GlobalMiddleware } from './middleware/global.middleware';
import { logCreatorState } from './middleware/log-creator-state.middleware';
import { stateMiddleware } from './middleware/state.middleware';
import { autoCommentReply } from './plugins/auto-comment-reply.plugin';
import { chainFilters } from './plugins/chain-filters.plugin';
import { selfDestructedReply } from './plugins/self-destructed.plugin';
import { RedisChatSession } from './session-providers/redis-chat-session-storage.provider';
import { RedisSession } from './session-providers/redis-session-storage.provider';
import { deleteMessageTransformer } from './transformers/delete-message.transformer';
import { disableLogsChatTransformer } from './transformers/disable-logs-chat.transformer';
import { swindlerBotsChatId, swindlerHelpChatId, swindlerMessageChatId } from './creator';
import { i18n } from './i18n';

moment.tz.setDefault('Europe/Kiev');
moment.locale('uk');

const rootMenu = new Menu<GrammyMenuContext>('root');

// eslint-disable-next-line no-secrets/no-secrets
/**
 * Gets main bot instance.
 * Disables redis logic if used in unit testing.
 * @param bot - The Grammy bot instance to configure and initialize.
 * @returns A Promise that resolves to the fully configured bot instance.
 * @example
 * ```ts
 * const initialBot = new Bot<GrammyContext>(environmentConfig?.BOT_TOKEN);
 * const bot = await getBot(initialBot);
 * ```
 */
export const getBot = async (bot: Bot<GrammyContext>) => {
  if (!environmentConfig.UNIT_TESTING) {
    await redisClient.client.connect().then(() => logger.info('Redis client successfully started'));
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
    // NOTE: advance logic could be added here when no alarm states are available
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
  bot.use(i18n);

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
