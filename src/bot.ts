import { Menu } from '@grammyjs/menu';
import { hydrateReply } from '@grammyjs/parse-mode';
import { Router } from '@grammyjs/router';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import { Bot } from 'grammy';
import Keyv from 'keyv';
import moment from 'moment-timezone';

import {
  CommandSetter,
  HelpMiddleware,
  RankMiddleware,
  SessionMiddleware,
  SettingsMiddleware,
  StartMiddleware,
  StatisticsMiddleware,
  SwindlersUpdateMiddleware,
  UpdatesMiddleware,
} from './bot/commands';
import { OnTextListener, TestTensorListener } from './bot/listeners';
import { MessageHandler } from './bot/message.handler';
import {
  botActiveMiddleware,
  botRedisActive,
  deleteMessageMiddleware,
  DeleteSwindlersMiddleware,
  GlobalMiddleware,
  ignoreBySettingsMiddleware,
  ignoreOld,
  nestedMiddleware,
  onlyAdmin,
  onlyCreator,
  onlyNotAdmin,
  onlyNotForwarded,
  onlyWhenBotAdmin,
  onlyWhitelisted,
  onlyWithText,
  performanceEndMiddleware,
  performanceStartMiddleware,
} from './bot/middleware';
import { botDemoteQuery, botInviteQuery, botKickQuery, botPromoteQuery } from './bot/queries';
import { RedisChatSession, RedisSession } from './bot/sessionProviders';
import { getAlarmMock } from './services/_mocks';
import { environmentConfig } from './config';
import { logsChat } from './creator';
import { redisClient } from './db';
import { settingsAvailableMessage } from './message';
import { ALARM_EVENT_KEY, alarmChatService, alarmService, initSwindlersContainer, redisService, S3Service } from './services';
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

  const startMiddleware = new StartMiddleware(bot);
  const helpMiddleware = new HelpMiddleware(startTime);
  const sessionMiddleware = new SessionMiddleware(startTime);
  const swindlersUpdateMiddleware = new SwindlersUpdateMiddleware(dynamicStorageService);
  const statisticsMiddleware = new StatisticsMiddleware(startTime);
  const updatesMiddleware = new UpdatesMiddleware();
  const settingsMiddleware = new SettingsMiddleware(airRaidAlarmStates.states);
  const deleteSwindlersMiddleware = new DeleteSwindlersMiddleware(bot, swindlersDetectService);
  const rankMiddleware = new RankMiddleware(tensorService);

  const messageHandler = new MessageHandler(tensorService);

  const onTextListener = new OnTextListener(bot, keyv, startTime, messageHandler);
  const tensorListener = new TestTensorListener(tensorService);

  rootMenu.register(tensorListener.initMenu(trainingThrottler));
  rootMenu.register(updatesMiddleware.initMenu());
  rootMenu.register(settingsMiddleware.initMenu());
  rootMenu.register(settingsMiddleware.initDescriptionSubmenu(), 'settingsMenu');
  rootMenu.register(settingsMiddleware.initAirRaidAlertSubmenu(), 'settingsMenu');

  bot.use(hydrateReply);

  bot.use(redisSession.middleware());
  bot.use(redisChatSession.middleware());

  bot.use(rootMenu as unknown as Menu<GrammyContext>);

  bot.use(wrapperErrorHandler(globalMiddleware.middleware()));

  const router = new Router<GrammyContext>((context) => context.session?.step || 'idle');

  bot.use(router);

  bot.command(
    'settings',
    deleteMessageMiddleware,
    onlyAdmin,
    nestedMiddleware((context, next) => {
      if (context.chat?.type !== 'private') {
        return next();
      }
    }, settingsMiddleware.sendSettingsMenu()),
    (context, next) => {
      if (context.chat.type === 'private') {
        return context.reply(settingsAvailableMessage);
      }

      return next();
    },
  );

  bot.command('start', startMiddleware.middleware());
  bot.command(['help', 'status'], helpMiddleware.middleware());
  bot.command('swindlers_update', swindlersUpdateMiddleware.middleware());

  bot.command('session', botActiveMiddleware, sessionMiddleware.middleware());
  bot.command('statistics', botActiveMiddleware, statisticsMiddleware.middleware());

  /* Training and tensor middlewares */
  bot.command('set_rank', onlyCreator, rankMiddleware.setRankMiddleware());
  bot.command('set_training_start_rank', onlyCreator, rankMiddleware.setTrainingStartRank());
  bot.command('set_training_chat_whitelist', onlyCreator, rankMiddleware.setTrainingChatWhitelist());
  bot.command('update_training_chat_whitelist', onlyCreator, rankMiddleware.updateTrainingChatWhitelist());

  bot.command('disable', onlyCreator, async (context) => {
    await redisService.setIsBotDeactivated(true);
    await commandSetter.setActive(false);
    await commandSetter.updateCommands();
    return context.reply('⛔️ Я виключений глобально');
  });

  bot.command('enable', onlyCreator, async (context) => {
    await redisService.setIsBotDeactivated(false);
    await commandSetter.setActive(true);
    await commandSetter.updateCommands();
    return context.reply('✅ Я включений глобально');
  });

  bot.command('start_alarm', onlyWhitelisted, () => {
    alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(true));
  });

  bot.command('end_alarm', onlyWhitelisted, () => {
    alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(false));
  });

  bot.command('leave', onlyCreator, (context) => context.leaveChat());

  bot.command('restart', onlyWhitelisted, async (context) => {
    await context.reply('Restarting...');
    await commandSetter.setActive(false);
    await bot.stop();
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(0);
  });

  bot.command('updates', botActiveMiddleware, onlyCreator, updatesMiddleware.initialization());
  router.route('confirmation', botActiveMiddleware, onlyCreator, updatesMiddleware.confirmation());
  router.route('messageSending', botActiveMiddleware, onlyCreator, updatesMiddleware.messageSending());

  bot.on('my_chat_member', botInviteQuery(bot), botPromoteQuery, botDemoteQuery, botKickQuery);

  bot.on(
    ['message:text', 'edited_message:text'],
    botRedisActive,
    ignoreOld(60),
    botActiveMiddleware,
    wrapperErrorHandler(tensorListener.middleware(trainingThrottler)),
    onlyNotAdmin,
    onlyNotForwarded,
    onlyWithText,
    onlyWhenBotAdmin,
    nestedMiddleware(ignoreBySettingsMiddleware('disableSwindlerMessage'), deleteSwindlersMiddleware.middleware()),
    nestedMiddleware(
      ignoreBySettingsMiddleware('disableStrategicInfo'),
      wrapperErrorHandler(performanceStartMiddleware),
      wrapperErrorHandler(onTextListener.middleware()),
      wrapperErrorHandler(performanceEndMiddleware),
    ),
  );

  bot.catch(globalErrorHandler);

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
