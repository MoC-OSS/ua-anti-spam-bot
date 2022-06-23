const { Bot, InputFile } = require('grammy');
const { hydrateReply } = require('@grammyjs/parse-mode');
const { Router } = require('@grammyjs/router');
const { Menu } = require('@grammyjs/menu');
const { error, env } = require('typed-dotenv').config();
const { apiThrottler } = require('@grammyjs/transformer-throttler');
const Keyv = require('keyv');

const { dataset } = require('../dataset/dataset');

const { redisClient } = require('./db');
const { redisService } = require('./services/redis.service');
const { S3Service } = require('./services/s3.service');
const { DynamicStorageService } = require('./services/dynamic-storage.service');
const { SwindlersBotsService } = require('./services/swindlers-bots.service');
const { SwindlersUrlsService } = require('./services/swindlers-urls.service');
const { googleService } = require('./services/google.service');

const { initTensor } = require('./tensor/tensor.service');
const { initSwindlersTensor } = require('./tensor/swindlers-tensor.service');
const { RedisSession, RedisChatSession } = require('./bot/sessionProviders');

const { MessageHandler } = require('./bot/message.handler');
const {
  CommandSetter,
  HelpMiddleware,
  SessionMiddleware,
  StartMiddleware,
  StatisticsMiddleware,
  UpdatesMiddleware,
  SwindlersUpdateMiddleware,
} = require('./bot/commands');
const { OnTextListener, TestTensorListener } = require('./bot/listeners');
const {
  DeleteSwindlersMiddleware,
  GlobalMiddleware,
  botActiveMiddleware,
  ignoreOld,
  onlyCreator,
  onlyNotAdmin,
  onlyNotForwarded,
  onlyWhenBotAdmin,
  onlyWithText,
  performanceEndMiddleware,
  performanceStartMiddleware,
} = require('./bot/middleware');
const { handleError, errorHandler, sleep } = require('./utils');
const { logsChat, creatorId } = require('./creator');

// TODO commented for settings feature
// const { getSettingsMenuMessage, settingsSubmitMessage, settingsDeleteItemMessage } = require('./message');

/**
 * @typedef { import("grammy").GrammyError } GrammyError
 * @typedef { import("@grammyjs/types/manage").BotCommand } BotCommand
 * @typedef { import("./types").GrammyContext } GrammyContext
 * @typedef { import("./types").SessionObject } SessionObject
 */

/**
 * @callback Next
 * @returns Promise<void>
 */

const keyv = new Keyv('sqlite://db.sqlite');
keyv.on('error', (err) => console.error('Connection Error', err));

if (error) {
  console.error('Something wrong with env variables');
  process.exit();
}

const rootMenu = new Menu('root');

// TODO commented for settings feature
// const menu = new Menu('settings')
//   .text(
//     (ctx) => (ctx.session.settings.disableDeleteMessage === false ? '⛔️' : '✅') + settingsDeleteItemMessage, // dynamic label
//     (ctx) => {
//       console.log('button press', ctx.session.settings.disableDeleteMessage);
//       if (ctx.session.settings.disableDeleteMessage === false) {
//         delete ctx.session.settings.disableDeleteMessage;
//       } else {
//         ctx.session.settings.disableDeleteMessage = false;
//       }
//
//       ctx.editMessageText(getSettingsMenuMessage(ctx.session.settings));
//     },
//   )
//   .row()
//   .text(settingsSubmitMessage, (ctx) => {
//     console.log(ctx);
//     ctx.deleteMessage();
//   });

(async () => {
  console.info('Waiting for the old instance to down...');
  await sleep(env.DEBUG ? 0 : 5000);
  console.info('Starting a new instance...');

  await redisClient.client.connect().then(() => console.info('Redis client successfully started'));

  const s3Service = new S3Service();
  const tensorService = await initTensor(s3Service);
  const swindlersTensorService = await initSwindlersTensor();
  tensorService.setSpamThreshold(await redisService.getBotTensorPercent());
  swindlersTensorService.setSpamThreshold(0.87);

  const startTime = new Date();

  const bot = new Bot(env.BOT_TOKEN);

  if (!env.DEBUG) {
    bot.api.sendMessage(logsChat, '*** 20220406204759 Migration started...').catch(() => {});
  }
  // eslint-disable-next-line global-require
  require('./20220406204759-migrate-redis-user-session')(bot, startTime)
    .then(() => {
      console.info('*** 20220406204759 Migration run successfully!!!');
      if (!env.DEBUG) {
        bot.api.sendMessage(logsChat, '*** 20220406204759 Migration run successfully!!!').catch(() => {});
      }
    })
    .catch(async (migrationError) => {
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
  const dynamicStorageService = new DynamicStorageService(googleService, dataset);
  await dynamicStorageService.init();

  const swindlersBotsService = new SwindlersBotsService(dynamicStorageService, 0.6);
  const swindlersUrlsService = new SwindlersUrlsService(dynamicStorageService, 0.8);

  const globalMiddleware = new GlobalMiddleware(bot);

  const startMiddleware = new StartMiddleware(bot);
  const helpMiddleware = new HelpMiddleware(startTime);
  const sessionMiddleware = new SessionMiddleware(startTime);
  const swindlersUpdateMiddleware = new SwindlersUpdateMiddleware(dynamicStorageService);
  const statisticsMiddleware = new StatisticsMiddleware(startTime);
  const updatesMiddleware = new UpdatesMiddleware(startTime);
  const deleteSwindlersMiddleware = new DeleteSwindlersMiddleware(
    dynamicStorageService,
    swindlersTensorService,
    swindlersBotsService,
    swindlersUrlsService,
  );

  const messageHandler = new MessageHandler(tensorService);

  const onTextListener = new OnTextListener(bot, keyv, startTime, messageHandler);
  const tensorListener = new TestTensorListener(tensorService);

  rootMenu.register(tensorListener.initMenu(trainingThrottler));
  rootMenu.register(updatesMiddleware.initMenu());

  bot.use(hydrateReply);

  bot.use(redisSession.middleware());
  bot.use(redisChatSession.middleware());

  bot.errorBoundary(handleError).use(rootMenu);

  bot.use(errorHandler(globalMiddleware.middleware()));

  const router = new Router((ctx) => ctx.session?.step || 'idle');

  bot.use(router);

  // TODO commented for settings feature

  bot.errorBoundary(handleError).command('start', errorHandler(startMiddleware.middleware()));
  bot.errorBoundary(handleError).command(['help', 'status'], errorHandler(helpMiddleware.middleware()));
  bot.errorBoundary(handleError).command('swindlers_update', errorHandler(swindlersUpdateMiddleware.middleware()));

  bot.errorBoundary(handleError).command('session', botActiveMiddleware, errorHandler(sessionMiddleware.middleware()));
  bot.errorBoundary(handleError).command('statistics', botActiveMiddleware, errorHandler(statisticsMiddleware.middleware()));

  bot.errorBoundary(handleError).command('get_tensor', onlyCreator, async (ctx) => {
    let positives = await redisService.getPositives();
    let negatives = await redisService.getNegatives();

    positives = positives.map((singleCase) => singleCase.replace(/\n/g, ' '));
    negatives = negatives.map((singleCase) => singleCase.replace(/\n/g, ' '));

    if (positives.length) {
      await ctx.api.sendDocument(creatorId, new InputFile(Buffer.from(positives.join('\n')), `positives-${new Date().toISOString()}.csv`));
    }

    if (negatives.length) {
      await ctx.api.sendDocument(creatorId, new InputFile(Buffer.from(negatives.join('\n')), `negatives-${new Date().toISOString()}.csv`));
    }

    await redisService.deletePositives();
    await redisService.deleteNegatives();
  });

  const botRedisActive = async (ctx, next) => {
    const isDeactivated = await redisService.getIsBotDeactivated();
    const isInLocal = ctx.chat.type === 'private' && ctx.chat.id === creatorId;

    if (!isDeactivated || isInLocal) {
      return next();
    }

    console.info('Skip due to redis: ', ctx.chat.id);
  };

  bot.command(
    'set_rank',
    onlyCreator,
    errorHandler(async (ctx) => {
      const newPercent = +ctx.match;

      if (!ctx.match) {
        return ctx.reply(`Current rank is: ${await redisService.getBotTensorPercent()}`);
      }

      if (Number.isNaN(newPercent)) {
        return ctx.reply(`Cannot parse is as a number:\n${ctx.match}`);
      }

      tensorService.setSpamThreshold(newPercent);
      await redisService.setBotTensorPercent(newPercent);
      ctx.reply(`Set new tensor rank: ${newPercent}`);
    }),
  );

  bot.command(
    'set_training_start_rank',
    onlyCreator,
    errorHandler(async (ctx) => {
      const newPercent = +ctx.match;

      if (!ctx.match) {
        return ctx.reply(`Current training start rank is: ${await redisService.getTrainingStartRank()}`);
      }

      if (Number.isNaN(newPercent)) {
        return ctx.reply(`Cannot parse is as a number:\n${ctx.match}`);
      }

      await redisService.setTrainingStartRank(newPercent);
      ctx.reply(`Set new training start rank rank: ${newPercent}`);
    }),
  );

  bot.command(
    'set_training_chat_whitelist',
    onlyCreator,
    errorHandler(async (ctx) => {
      const newChats = ctx.match;

      if (!ctx.match) {
        return ctx.reply(`Current training chat whitelist is:\n\n${(await redisService.getTrainingChatWhitelist()).join(',')}`);
      }

      await redisService.setTrainingChatWhitelist(newChats);
      ctx.reply(`Set training chat whitelist is:\n\n${newChats}`);
    }),
  );

  bot.command(
    'update_training_chat_whitelist',
    onlyCreator,
    errorHandler(async (ctx) => {
      const newChats = ctx.match;

      if (!ctx.match) {
        return ctx.reply(`Current training chat whitelist is:\n\n${(await redisService.getTrainingChatWhitelist()).join(',')}`);
      }

      await redisService.updateTrainingChatWhitelist(newChats);
      ctx.reply(`Set training chat whitelist is:\n\n${newChats}`);
    }),
  );

  bot.command(
    'disable',
    onlyCreator,
    errorHandler(async (ctx) => {
      await redisService.setIsBotDeactivated(true);
      commandSetter.setActive(false);
      commandSetter.updateCommands();
      ctx.reply('⛔️ Я виключений глобально');
    }),
  );

  bot.command(
    'enable',
    onlyCreator,
    errorHandler(async (ctx) => {
      await redisService.setIsBotDeactivated(false);
      commandSetter.setActive(true);
      commandSetter.updateCommands();
      ctx.reply('✅ Я включений глобально');
    }),
  );

  bot.command('leave', onlyCreator, (ctx) => {
    ctx.leaveChat().catch(() => {});
  });

  bot.command('updates', botActiveMiddleware, onlyCreator, errorHandler(updatesMiddleware.initialization()));
  router.route('confirmation', botActiveMiddleware, onlyCreator, errorHandler(updatesMiddleware.confirmation()));
  router.route('messageSending', botActiveMiddleware, onlyCreator, errorHandler(updatesMiddleware.messageSending()));

  // TODO commented for settings feature
  // bot.command('settings', (ctx) => {
  //   ctx.reply(getSettingsMenuMessage(ctx.session.settings), { reply_markup: menu });
  // });

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
      deleteSwindlersMiddleware.middleware(),
      errorHandler(performanceStartMiddleware),
      errorHandler(onTextListener.middleware()),
      errorHandler(performanceEndMiddleware),
    );

  bot.catch(handleError);

  bot.start({
    onStart: () => {
      console.info(`Bot @${bot.me.username} started!`, new Date().toString());

      if (!env.DEBUG) {
        bot.api
          .sendMessage(logsChat, `🎉 <b>Bot @${bot.me.username} has been started!</b>\n<i>${new Date().toString()}</i>`, {
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
