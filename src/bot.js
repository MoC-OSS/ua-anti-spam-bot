const { error, env } = require('typed-dotenv').config();
const { Telegraf } = require('telegraf');
const Keyv = require('keyv');
const { RedisSession } = require('./bot/sessionProviders');

const { HelpMiddleware, SessionMiddleware, StartMiddleware, StatisticsMiddleware } = require('./bot/commands');
const { OnTextListener } = require('./bot/listeners');
const { GlobalMiddleware, performanceMiddleware } = require('./bot/middleware');
const { handleError, errorHandler, sleep } = require('./utils');

/**
 * @typedef { import("telegraf").Context } TelegrafContext
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

(async () => {
  console.info('Waiting for the old instance to down...');
  await sleep(5000);
  console.info('Starting a new instance...');

  const startTime = new Date();

  const bot = new Telegraf(env.BOT_TOKEN);

  const redisSession = new RedisSession(env.REDIS_URL);

  const globalMiddleware = new GlobalMiddleware(bot);

  const startMiddleware = new StartMiddleware(bot);
  const helpMiddleware = new HelpMiddleware(startTime);
  const sessionMiddleware = new SessionMiddleware(startTime);
  const statisticsMiddleware = new StatisticsMiddleware(startTime);

  const onTextListener = new OnTextListener(keyv, startTime);

  bot.use(redisSession.middleware());

  bot.use(errorHandler(globalMiddleware.middleware()));

  bot.start(errorHandler(startMiddleware.middleware()));
  bot.help(errorHandler(helpMiddleware.middleware()));

  bot.command('/session', errorHandler(sessionMiddleware.middleware()));
  bot.command('/statistics', errorHandler(statisticsMiddleware.middleware()));

  bot.on('text', errorHandler(onTextListener.middleware()), errorHandler(performanceMiddleware));

  bot.catch(handleError);

  bot.launch().then(() => {
    console.info('Bot started!', new Date().toString());
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
