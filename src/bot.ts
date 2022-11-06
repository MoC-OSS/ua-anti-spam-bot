import { Menu } from '@grammyjs/menu';
import { hydrateReply } from '@grammyjs/parse-mode';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import express from 'express';
import { Bot } from 'grammy';
import Keyv from 'keyv';
import moment from 'moment-timezone';

import { CommandSetter } from './bot/commands';
import {
  getBeforeAnyComposer,
  getCreatorCommandsComposer,
  getMessagesComposer,
  getPrivateCommandsComposer,
  getPublicCommandsComposer,
  getSaveToSheetComposer,
} from './bot/composers';
import { OnTextListener, TestTensorListener } from './bot/listeners';
import { MessageHandler } from './bot/message.handler';
import { DeleteSwindlersMiddleware, GlobalMiddleware } from './bot/middleware';
import { RedisChatSession, RedisSession } from './bot/sessionProviders';
import { environmentConfig } from './config';
import { logsChat, swindlerBotsChatId, swindlerMessageChatId } from './creator';
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
  await sleep(environmentConfig.DEBUG ? 0 : 5000);
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

  const { beforeAnyComposer } = getBeforeAnyComposer({ bot });
  const { publicCommandsComposer } = getPublicCommandsComposer({ bot, rootMenu, startTime, states: airRaidAlarmStates.states });
  const { privateCommandsComposer } = getPrivateCommandsComposer({
    bot,
    commandSetter,
    dynamicStorageService,
    startTime,
    tensorService,
  });
  const { creatorCommandsComposer } = getCreatorCommandsComposer({ commandSetter, rootMenu, tensorService });
  const { messagesComposer } = getMessagesComposer({ onTextListener, tensorListener, trainingThrottler, deleteSwindlersMiddleware });

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

  rootMenu.register(tensorListener.initMenu(trainingThrottler));

  bot.use(hydrateReply);

  bot.use(redisSession.middleware());
  bot.use(redisChatSession.middleware());

  bot.use(rootMenu as unknown as Menu<GrammyContext>);

  bot.use(wrapperErrorHandler(globalMiddleware.middleware()));

  bot.use(beforeAnyComposer);
  bot.use(creatorCommandsComposer);
  bot.use(privateCommandsComposer);
  bot.use(publicCommandsComposer);
  bot.use(swindlerMessageSaveToSheetComposer);
  bot.use(swindlerBotsSaveToSheetComposer);
  bot.use(messagesComposer);

  bot.catch(globalErrorHandler);

  const app = express();
  app.get('/health-check', (request, response) => response.json({ status: 'ok' }));
  app.listen(environmentConfig.PORT, environmentConfig.HOST, () => {
    console.info(`App started on http://localhost:${environmentConfig.PORT}`);
  });

  await bot.start({
    onStart: () => {
      console.info(`Bot @${bot.botInfo.username} started!`, new Date().toString());

      if (environmentConfig.DEBUG) {
        // For development
      } else {
        bot.api
          .sendMessage(logsChat, `🎉 <b>Bot @${bot.botInfo.username} has been started!</b>\n<i>${new Date().toString()}</i>`, {
            parse_mode: 'HTML',
          })
          .catch(() => {
            console.error('This bot is not authorised in this LOGS chat!');
          });
      }
    },
  });

  // Enable graceful stop
  process.once('SIGINT', () => {
    bot.stop().catch(emptyFunction);
  });
  process.once('SIGTERM', () => {
    bot.stop().catch(emptyFunction);
  });
})().catch((error) => {
  console.error('FATAL: Bot crashed with error:', error);
  throw error;
});
