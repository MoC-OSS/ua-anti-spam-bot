const { error, env } = require('typed-dotenv').config();
const { Telegraf } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const Keyv = require('keyv');

const { HelpMiddleware, SessionMiddleware, StartMiddleware, StatisticsMiddleware } = require('./bot/commands');
const { OnTextListener } = require('./bot/listeners');
const { GlobalMiddleware, performanceMiddleware } = require('./bot/middleware');
const { handleError, sleep } = require('./utils');

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

  const localSession = new LocalSession({ database: 'telegraf-session.json' });

  const globalMiddleware = new GlobalMiddleware(bot);

  const startMiddleware = new StartMiddleware(bot);
  const helpMiddleware = new HelpMiddleware(startTime);
  const sessionMiddleware = new SessionMiddleware(startTime);
  const statisticsMiddleware = new StatisticsMiddleware(startTime);

  const onTextListener = new OnTextListener(keyv, startTime);

  bot.use(localSession.middleware());
  bot.use(globalMiddleware.middleware());

  bot.start(startMiddleware.middleware());
  bot.help(helpMiddleware.middleware());

  bot.command('/session', sessionMiddleware.middleware());
  bot.command('/statistics', statisticsMiddleware.middleware());

  bot.on('text', onTextListener.middleware(), performanceMiddleware);
  // bot.on('text', () => {});

  bot.catch(handleError);

  bot.launch().then(() => {
    console.info('Bot started!', new Date().toString());
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
