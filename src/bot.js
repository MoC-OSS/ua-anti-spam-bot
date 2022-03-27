const { Bot } = require('grammy');
const { hydrateReply } = require('@grammyjs/parse-mode');
const { Router } = require('@grammyjs/router');
const { Menu } = require('@grammyjs/menu');
const { error, env } = require('typed-dotenv').config();
const Keyv = require('keyv');
const { RedisSession } = require('./bot/sessionProviders');

const { HelpMiddleware, SessionMiddleware, StartMiddleware, StatisticsMiddleware, UpdatesMiddleware } = require('./bot/commands');
const { UpdatesInputMiddleware, UpdatesConfirmationMiddleware } = require('./bot/routers');
const { OnTextListener } = require('./bot/listeners');
const { GlobalMiddleware, performanceMiddleware, botActiveMiddleware, onlyNotAdmin } = require('./bot/middleware');
const { handleError, errorHandler, sleep } = require('./utils');
const { logsChat } = require('./creator');

// TODO commented for settings feature
// const { getSettingsMenuMessage, settingsSubmitMessage, settingsDeleteItemMessage } = require('./message');

/**
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

const menu = new Menu('approveUpdatesMenu')
  .text({ text: 'Піддверджую', payload: 'approve' })
  .row()
  .text({ text: 'Відмінити', payload: 'cancel' });

(async () => {
  console.info('Waiting for the old instance to down...');
  await sleep(5000);
  console.info('Starting a new instance...');

  const startTime = new Date();

  const bot = new Bot(env.BOT_TOKEN);

  const redisSession = new RedisSession();

  const globalMiddleware = new GlobalMiddleware(bot);

  const startMiddleware = new StartMiddleware(bot);
  const helpMiddleware = new HelpMiddleware(startTime);
  const sessionMiddleware = new SessionMiddleware(startTime);
  const statisticsMiddleware = new StatisticsMiddleware(startTime);
  const updatesMiddleware = new UpdatesMiddleware(startTime);
  const updatesInputMiddleware = new UpdatesInputMiddleware();
  const updatesConfirmationMiddleware = new UpdatesConfirmationMiddleware();

  const onTextListener = new OnTextListener(keyv, startTime);

  bot.use(hydrateReply);

  bot.use(redisSession.middleware());

  bot.use(errorHandler(globalMiddleware.middleware()));

  bot.use(menu);

  const router = new Router((ctx) => ctx.session.step);

  bot.use(router);

  // TODO commented for settings feature

  bot.command('start', errorHandler(startMiddleware.middleware()));
  bot.command('help', errorHandler(helpMiddleware.middleware()));

  bot.command('session', botActiveMiddleware, errorHandler(sessionMiddleware.middleware()));
  bot.command('statistics', botActiveMiddleware, errorHandler(statisticsMiddleware.middleware()));

  bot.command('updates', botActiveMiddleware, errorHandler(updatesMiddleware.middleware()));

  router.route('updatesInput', botActiveMiddleware, errorHandler(updatesInputMiddleware.middleware()));
  router.route('updatesConfirmation', botActiveMiddleware, errorHandler(updatesConfirmationMiddleware.middleware()));

  // TODO commented for settings feature
  // bot.command('settings', (ctx) => {
  //   ctx.reply(getSettingsMenuMessage(ctx.session.settings), { reply_markup: menu });
  // });

  bot.on(
    ['message', 'edited_message'],
    botActiveMiddleware,
    onlyNotAdmin,
    errorHandler(onTextListener.middleware()),
    errorHandler(performanceMiddleware),
  );

  bot.catch(handleError);

  bot.start({
    onStart: () => {
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
    },
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop());
  process.once('SIGTERM', () => bot.stop());
})();
