const { error, env } = require('typed-dotenv').config();
// const { Telegraf } = require('telegraf');
// const LocalSession = require('telegraf-session-local');
const Keyv = require('keyv');
const { Bot } = require('grammy');
const { Menu } = require('@grammyjs/menu');

// const { HelpMiddleware, SessionMiddleware, StartMiddleware, StatisticsMiddleware } = require('./bot/commands');
const { StartMiddleware } = require('./bot/commands');
// const { OnTextListener } = require('./bot/listeners');
// const { GlobalMiddleware, performanceMiddleware } = require('./bot/middleware');
const { handleError, errorHandler, sleep } = require('./utils');
const { logsChat } = require('./creator');

/**
 * @typedef { import("./types").TelegrafContext } TelegrafContext
 * @typedef { import("grammy").Context } GrammyContext
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

const menu = new Menu('my-menu-identifier')
  .text('A', (ctx) => ctx.reply('You pressed A!'))
  .row()
  .text('B', (ctx) => ctx.reply('You pressed B!'));

(async () => {
  console.info('Waiting for the old instance to down...');
  await sleep(5000);
  console.info('Starting a new instance...');

  // const startTime = new Date();

  const bot = new Bot(env.BOT_TOKEN);

  // const localSession = new LocalSession({ database: 'telegraf-session.json' });
  //
  // const globalMiddleware = new GlobalMiddleware(bot);
  //
  const startMiddleware = new StartMiddleware(bot);
  // const helpMiddleware = new HelpMiddleware(startTime);
  // const sessionMiddleware = new SessionMiddleware(startTime);
  // const statisticsMiddleware = new StatisticsMiddleware(startTime);

  // const onTextListener = new OnTextListener(keyv, startTime);

  bot.use(menu);

  // bot.use(localSession.middleware());
  // bot.use(errorHandler(globalMiddleware.middleware()));
  //
  bot.command('start', errorHandler(startMiddleware.middleware()));
  // bot.command('help', errorHandler(helpMiddleware.middleware()));
  //
  // bot.command('session', errorHandler(sessionMiddleware.middleware()));
  // bot.command('statistics', errorHandler(statisticsMiddleware.middleware()));
  //
  // bot.command('settings', (ctx) => {
  //   ctx.reply('Check out this menu:', { reply_markup: menu });
  // });

  // bot.on(['message', 'edited_message'], errorHandler(onTextListener.middleware()), errorHandler(performanceMiddleware));
  bot.on(['message', 'edited_message'], () => {});
  // bot.on('text', () => {});

  bot.catch(handleError);

  bot.start().then(() => {
    console.info('Bot started!', new Date().toString());

    if (!env.DEBUG) {
      bot.api
        .sendMessage(logsChat, `🎉 <b>Bot @${bot.me.username} has been started!</b>\n<i>${new Date().toString()}</i>`, {
          parse_mode: 'HTML',
        })
        .catch((e) => {
          console.error('This bot is not authorised in this LOGS chat!');
          handleError(e);
        });
    }
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop());
  process.once('SIGTERM', () => bot.stop());
})();
