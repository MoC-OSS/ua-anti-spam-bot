const { Bot } = require('grammy');
const { hydrateReply } = require('@grammyjs/parse-mode');
const { Menu } = require('@grammyjs/menu');
const { error, env } = require('typed-dotenv').config();
const Keyv = require('keyv');

const { TensorService } = require('./tensor/tensor.service');
const { RedisSession } = require('./bot/sessionProviders');

const { HelpMiddleware, SessionMiddleware, StartMiddleware, StatisticsMiddleware } = require('./bot/commands');
const { OnTextListener, TestTensorListener } = require('./bot/listeners');
const { GlobalMiddleware, performanceMiddleware, botActiveMiddleware, onlyNotAdmin, onlyNotForwarded } = require('./bot/middleware');
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
  await sleep(5000);
  console.info('Starting a new instance...');

  const tensorService = new TensorService('./temp/model.json', 0.65);
  await tensorService.loadModel();

  const startTime = new Date();

  const bot = new Bot(env.BOT_TOKEN);

  const redisSession = new RedisSession();

  const globalMiddleware = new GlobalMiddleware(bot);

  const startMiddleware = new StartMiddleware(bot);
  const helpMiddleware = new HelpMiddleware(startTime);
  const sessionMiddleware = new SessionMiddleware(startTime);
  const statisticsMiddleware = new StatisticsMiddleware(startTime);

  const onTextListener = new OnTextListener(keyv, startTime);
  const tensorListener = new TestTensorListener(tensorService, redisSession);

  rootMenu.register(tensorListener.initMenu());

  bot.use(hydrateReply);

  bot.use(redisSession.middleware());

  bot.use(errorHandler(globalMiddleware.middleware()));

  bot.use(rootMenu);

  bot.command('start', errorHandler(startMiddleware.middleware()));
  bot.command('help', errorHandler(helpMiddleware.middleware()));

  bot.command('session', botActiveMiddleware, errorHandler(sessionMiddleware.middleware()));
  bot.command('statistics', botActiveMiddleware, errorHandler(statisticsMiddleware.middleware()));

  // TODO commented for settings feature
  // bot.command('settings', (ctx) => {
  //   ctx.reply(getSettingsMenuMessage(ctx.session.settings), { reply_markup: menu });
  // });

  bot.on(
    ['message', 'edited_message'],
    botActiveMiddleware,
    tensorListener.middleware(),
    onlyNotAdmin,
    onlyNotForwarded,
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
