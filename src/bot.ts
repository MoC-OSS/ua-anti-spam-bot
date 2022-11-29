/* eslint-disable @typescript-eslint/no-misused-promises */
import { Menu } from '@grammyjs/menu';
import { hydrateReply } from '@grammyjs/parse-mode';
import { run, sequentialize } from '@grammyjs/runner';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import { Bot } from 'grammy';
import Keyv from 'keyv';
import moment from 'moment-timezone';
import ms from 'ms';

import { CommandSetter } from './bot/commands';
import {
  getBeforeAnyComposer,
  getCreatorCommandsComposer,
  getHealthCheckComposer,
  getMessagesComposer,
  getPrivateCommandsComposer,
  getPublicCommandsComposer,
  getSaveToSheetComposer,
  getTensorTrainingComposer,
} from './bot/composers';
import {
  getNoCardsComposer,
  getNoMentionsComposer,
  getNoUrlsComposer,
  getStrategicComposer,
  getSwindlersComposer,
} from './bot/composers/messages';
import { getNoForwardsComposer } from './bot/composers/messages/no-forward.composer';
import { OnTextListener, TestTensorListener } from './bot/listeners';
import { MessageHandler } from './bot/message.handler';
import { DeleteSwindlersMiddleware, GlobalMiddleware } from './bot/middleware';
import { RedisChatSession, RedisSession } from './bot/sessionProviders';
import { deleteMessageTransformer } from './bot/transformers';
import { runBotExpressServer } from './bot-express.server';
import { environmentConfig } from './config';
import { logsChat, swindlerBotsChatId, swindlerHelpChatId, swindlerMessageChatId } from './creator';
import { redisClient } from './db';
import { alarmChatService, alarmService, initSwindlersContainer, redisService, S3Service, swindlersGoogleService } from './services';
import { initTensor } from './tensor';
import type { GrammyContext, GrammyMenuContext } from './types';
import { emptyFunction, globalErrorHandler, sleep, wrapperErrorHandler } from './utils';

moment.tz.setDefault('Europe/Kiev');
moment.locale('uk');

const keyv = new Keyv('sqlite://db.sqlite');
keyv.on('error', (error_) => console.error('Connection Error', error_));

const rootMenu = new Menu<GrammyMenuContext>('root');

(async () => {
  console.info('Waiting for the old instance to down...');
  await sleep(environmentConfig.ENV === 'local' ? 0 : ms('5s'));
  console.info('Starting a new instance...');

  await redisClient.client.connect().then(() => console.info('Redis client successfully started'));

  const s3Service = new S3Service();
  const tensorService = await initTensor(s3Service);
  tensorService.setSpamThreshold(await redisService.getBotTensorPercent());

  const { dynamicStorageService, swindlersDetectService } = await initSwindlersContainer();

  const startTime = new Date();

  const bot = new Bot<GrammyContext>(environmentConfig?.BOT_TOKEN);

  await alarmChatService.init(bot.api);
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

  const globalMiddleware = new GlobalMiddleware();

  const deleteSwindlersMiddleware = new DeleteSwindlersMiddleware(bot, swindlersDetectService);

  const messageHandler = new MessageHandler(tensorService);

  const onTextListener = new OnTextListener(bot, keyv, startTime, messageHandler);
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

  // Tensor testing old logic
  const { tensorTrainingComposer } = getTensorTrainingComposer({
    tensorListener,
    trainingThrottler,
  });

  // Message composers
  const { noCardsComposer } = getNoCardsComposer();
  const { noUrlsComposer } = getNoUrlsComposer();
  const { noMentionsComposer } = getNoMentionsComposer();
  const { noForwardsComposer } = getNoForwardsComposer();
  const { swindlersComposer } = getSwindlersComposer({ deleteSwindlersMiddleware });
  const { strategicComposer } = getStrategicComposer({ onTextListener });

  const { messagesComposer } = getMessagesComposer({
    noCardsComposer,
    noUrlsComposer,
    noMentionsComposer,
    noForwardsComposer,
    swindlersComposer,
    strategicComposer,
  });

  rootMenu.register(tensorListener.initMenu(trainingThrottler));

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

  bot.use(redisSession.middleware());
  bot.use(redisChatSession.middleware());

  // Set message as deleted when deleteMessage method has been called
  bot.use((context, next) => {
    context.api.config.use(deleteMessageTransformer(context));
    return next();
  });

  bot.use(rootMenu as unknown as Menu<GrammyContext>);

  bot.use(wrapperErrorHandler(globalMiddleware.middleware()));

  // Generic composers
  bot.use(healthCheckComposer);
  bot.use(beforeAnyComposer);

  // Commands
  bot.use(creatorCommandsComposer);
  bot.use(privateCommandsComposer);
  bot.use(publicCommandsComposer);

  // Swindlers helpers
  bot.use(swindlerMessageSaveToSheetComposer);
  bot.use(swindlerBotsSaveToSheetComposer);
  bot.use(swindlerHelpSaveToSheetComposer);

  // Tensor testing old logic
  bot.use(tensorTrainingComposer);

  // Main message composer
  bot.use(messagesComposer);

  bot.catch(globalErrorHandler);

  runBotExpressServer();

  const runner = run(bot, 500, {
    allowed_updates: [
      'chat_member',
      'edited_message',
      'channel_post',
      'edited_channel_post',
      'inline_query',
      'chosen_inline_result',
      'callback_query',
      'shipping_query',
      'pre_checkout_query',
      'poll',
      'poll_answer',
      'my_chat_member',
      'chat_member',
      'chat_join_request',
      'message',
    ],
  });

  /**
   * Check when the bot is run
   * */
  if (!bot.isInited()) {
    await bot.init();
  }

  console.info(`Bot @${bot.botInfo.username} started!`, new Date().toString());

  if (environmentConfig.ENV !== 'local') {
    bot.api
      .sendMessage(logsChat, `🎉 <b>Bot @${bot.botInfo.username} has been started!</b>\n<i>${new Date().toString()}</i>`, {
        parse_mode: 'HTML',
      })
      .catch(() => {
        console.error('This bot is not authorized in this LOGS chat!');
      });

    /**
     * Enable alarm service only after bot is started
     * */
    alarmService.updatesEmitter.on('connect', () => {
      bot.api.sendMessage(logsChat, '🎉 Air Raid Alarm API has been started!').catch(() => {
        console.error('This bot is not authorized in this LOGS chat!');
      });
    });

    alarmService.updatesEmitter.on('close', () => {
      bot.api.sendMessage(logsChat, '⛔️ Air Raid Alarm API has been stopped!').catch(() => {
        console.error('This bot is not authorized in this LOGS chat!');
      });
    });
  }

  alarmService.enable();

  // Enable graceful stop
  const stopRunner = () => runner.isRunning() && runner.stop();
  process.once('SIGINT', stopRunner);
  process.once('SIGTERM', stopRunner);
})().catch((error) => {
  console.error('FATAL: Bot crashed with error:', error);
  throw error;
});
