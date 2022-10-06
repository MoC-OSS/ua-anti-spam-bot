import { Menu } from '@grammyjs/menu';
import { hydrateReply } from '@grammyjs/parse-mode';
import { Router } from '@grammyjs/router';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import { Bot, InputFile } from 'grammy';
import Keyv from 'keyv';
import moment from 'moment-timezone';

import { CommandSetter, SettingsMiddleware, StatisticsMiddleware, SwindlersUpdateMiddleware, UpdatesMiddleware } from './bot/commands';
import { OnTextListener, TestTensorListener } from './bot/listeners';
import { MessageHandler } from './bot/message.handler';
import {
  botActiveMiddleware,
  deleteMessageMiddleware,
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
import { RedisChatSession, RedisSession } from './bot/sessionProviders';
import { getAlarmMock } from './services/_mocks';
import { environmentConfig } from './config';
import { creatorId, logsChat } from './creator';
import { redisClient } from './db';
import { settingsAvailableMessage } from './message';
import { ALARM_EVENT_KEY, alarmChatService, alarmService, initSwindlersContainer, redisService, S3Service } from './services';
import { initTensor } from './tensor';
import type { GrammyContext } from './types';
import { errorHandler, handleError, sleep } from './utils';

/**
 * @typedef { import("grammy").GrammyError } GrammyError
 * @typedef { import("@grammyjs/types/manage").BotCommand } BotCommand
 * @typedef { import("./types").GrammyContext } GrammyContext
 * @typedef { import("./types").SessionObject } SessionObject
 * @typedef { import("./types").GrammyMiddleware } GrammyMiddleware
 * @typedef { import("./types").AlarmNotification } AlarmNotification
 */

/**
 * @callback Next
 * @returns Promise<void>
 */

moment.tz.setDefault('Europe/Kiev');
moment.locale('uk');

const keyv = new Keyv('sqlite://db.sqlite');
keyv.on('error', (error_) => console.error('Connection Error', error_));

const rootMenu = new Menu('root');

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

  if (!environmentConfig.DEBUG) {
    bot.api.sendMessage(logsChat, '*** 20220406204759 Migration started...').catch(() => {});
  }
  // eslint-disable-next-line global-require
  require('./20220406204759-migrate-redis-user-session')(bot, startTime)
    .then(() => {
      console.info('*** 20220406204759 Migration run successfully!!!');
      if (!environmentConfig.DEBUG) {
        bot.api.sendMessage(logsChat, '*** 20220406204759 Migration run successfully!!!').catch(() => {});
      }
    })
    .catch(async (migrationError: any) => {
      await bot.api.sendMessage(logsChat, `Migration failed! Reason: ${migrationError.reason}`).catch(() => {});
      await bot.api.sendMessage(logsChat, JSON.stringify(migrationError)).catch(() => {});
    });

  const commandSetter = new CommandSetter(bot, startTime, !(await redisService.getIsBotDeactivated()));

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

  const globalMiddleware = new GlobalMiddleware(bot);

  const startMiddleware = new StartMiddleware(bot);
  const helpMiddleware = new HelpMiddleware(startTime);
  const sessionMiddleware = new SessionMiddleware(startTime);
  const swindlersUpdateMiddleware = new SwindlersUpdateMiddleware(dynamicStorageService);
  const statisticsMiddleware = new StatisticsMiddleware(startTime);
  const updatesMiddleware = new UpdatesMiddleware(startTime);
  const settingsMiddleware = new SettingsMiddleware(airRaidAlarmStates.states);
  const deleteSwindlersMiddleware = new DeleteSwindlersMiddleware(swindlersDetectService);

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

  bot.errorBoundary(handleError).use(rootMenu);

  bot.use(errorHandler(globalMiddleware.middleware()));

  const router = new Router((context) => context.session?.step || 'idle');

  bot.use(router);

  bot.errorBoundary(handleError).command(
    'settings',
    deleteMessageMiddleware,
    onlyAdmin,
    nestedMiddleware((context, next) => {
      if (context.chat.type !== 'private') {
        return next();
      }
    }, errorHandler(settingsMiddleware.sendSettingsMenu())),
    (context, next) => {
      if (context.chat.type === 'private') {
        context.reply(settingsAvailableMessage);
      }

      return next();
    },
  );

  bot.errorBoundary(handleError).command('start', errorHandler(startMiddleware.middleware()));
  bot.errorBoundary(handleError).command(['help', 'status'], errorHandler(helpMiddleware.middleware()));
  bot.errorBoundary(handleError).command('swindlers_update', errorHandler(swindlersUpdateMiddleware.middleware()));

  bot.errorBoundary(handleError).command('session', botActiveMiddleware, errorHandler(sessionMiddleware.middleware()));
  bot.errorBoundary(handleError).command('statistics', botActiveMiddleware, errorHandler(statisticsMiddleware.middleware()));

  bot.errorBoundary(handleError).command('get_tensor', onlyCreator, async (context) => {
    let positives = await redisService.getPositives();
    let negatives = await redisService.getNegatives();

    positives = positives.map((singleCase) => singleCase.replace(/\n/g, ' '));
    negatives = negatives.map((singleCase) => singleCase.replace(/\n/g, ' '));

    if (positives.length > 0) {
      await context.api.sendDocument(
        creatorId,
        new InputFile(Buffer.from(positives.join('\n')), `positives-${new Date().toISOString()}.csv`),
      );
    }

    if (negatives.length > 0) {
      await context.api.sendDocument(
        creatorId,
        new InputFile(Buffer.from(negatives.join('\n')), `negatives-${new Date().toISOString()}.csv`),
      );
    }

    await redisService.deletePositives();
    await redisService.deleteNegatives();
  });

  const botRedisActive = async (context, next) => {
    const isDeactivated = await redisService.getIsBotDeactivated();
    const isInLocal = context.chat.type === 'private' && context.chat.id === creatorId;

    if (!isDeactivated || isInLocal) {
      return next();
    }

    console.info('Skip due to redis:', context.chat.id);
  };

  bot.command(
    'set_rank',
    onlyCreator,
    errorHandler(async (context) => {
      const newPercent = +context.match;

      if (!context.match) {
        return context.reply(`Current rank is: ${await redisService.getBotTensorPercent()}`);
      }

      if (Number.isNaN(newPercent)) {
        return context.reply(`Cannot parse is as a number:\n${context.match}`);
      }

      tensorService.setSpamThreshold(newPercent);
      await redisService.setBotTensorPercent(newPercent);
      context.reply(`Set new tensor rank: ${newPercent}`);
    }),
  );

  bot.command(
    'set_training_start_rank',
    onlyCreator,
    errorHandler(async (context) => {
      const newPercent = +context.match;

      if (!context.match) {
        return context.reply(`Current training start rank is: ${await redisService.getTrainingStartRank()}`);
      }

      if (Number.isNaN(newPercent)) {
        return context.reply(`Cannot parse is as a number:\n${context.match}`);
      }

      await redisService.setTrainingStartRank(newPercent);
      context.reply(`Set new training start rank rank: ${newPercent}`);
    }),
  );

  bot.command(
    'set_training_chat_whitelist',
    onlyCreator,
    errorHandler(async (context) => {
      const newChats = context.match;

      if (!context.match) {
        return context.reply(`Current training chat whitelist is:\n\n${(await redisService.getTrainingChatWhitelist()).join(',')}`);
      }

      await redisService.setTrainingChatWhitelist(newChats);
      context.reply(`Set training chat whitelist is:\n\n${newChats}`);
    }),
  );

  bot.command(
    'update_training_chat_whitelist',
    onlyCreator,
    errorHandler(async (context) => {
      const newChats = context.match;

      if (!context.match) {
        return context.reply(`Current training chat whitelist is:\n\n${(await redisService.getTrainingChatWhitelist()).join(',')}`);
      }

      await redisService.updateTrainingChatWhitelist(newChats);
      context.reply(`Set training chat whitelist is:\n\n${newChats}`);
    }),
  );

  bot.command(
    'disable',
    onlyCreator,
    errorHandler(async (context) => {
      await redisService.setIsBotDeactivated(true);
      commandSetter.setActive(false);
      commandSetter.updateCommands();
      context.reply('⛔️ Я виключений глобально');
    }),
  );

  bot.command(
    'enable',
    onlyCreator,
    errorHandler(async (context) => {
      await redisService.setIsBotDeactivated(false);
      commandSetter.setActive(true);
      commandSetter.updateCommands();
      context.reply('✅ Я включений глобально');
    }),
  );

  bot.command(
    'start_alarm',
    onlyWhitelisted,
    errorHandler(() => {
      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(true));
    }),
  );

  bot.command(
    'end_alarm',
    onlyWhitelisted,
    errorHandler(() => {
      alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(false));
    }),
  );

  bot.command('leave', onlyCreator, (context) => {
    context.leaveChat().catch(() => {});
  });

  bot.command('updates', botActiveMiddleware, onlyCreator, errorHandler(updatesMiddleware.initialization()));
  router.route('confirmation', botActiveMiddleware, onlyCreator, errorHandler(updatesMiddleware.confirmation()));
  router.route('messageSending', botActiveMiddleware, onlyCreator, errorHandler(updatesMiddleware.messageSending()));

  bot
    .errorBoundary(handleError)
    .on(
      ['message', 'edited_message'],
      botRedisActive,
      ignoreOld(60),
      botActiveMiddleware,
      errorHandler(tensorListener.middleware(trainingThrottler)),
      onlyNotAdmin,
      onlyNotForwarded,
      onlyWithText,
      onlyWhenBotAdmin,
      nestedMiddleware(ignoreBySettingsMiddleware('disableSwindlerMessage'), deleteSwindlersMiddleware.middleware()),
      nestedMiddleware(
        ignoreBySettingsMiddleware('disableStrategicInfo'),
        errorHandler(performanceStartMiddleware),
        errorHandler(onTextListener.middleware()),
        errorHandler(performanceEndMiddleware),
      ),
    );

  bot.catch(handleError);

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
  process.once('SIGINT', () => bot.stop());
  process.once('SIGTERM', () => bot.stop());
})();
