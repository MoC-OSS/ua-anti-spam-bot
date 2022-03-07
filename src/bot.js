const fs = require('fs');

const { error, env } = require('typed-dotenv').config();
const { Telegraf } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const Keyv = require('keyv');

const { CommandHandler } = require('./bot/command.handler');
const { telegramUtil, handleError, sleep, joinMessage } = require('./utils');
const { getStatisticsMessage } = require('./message');

/**
 * @typedef { import("./types").SessionObject } SessionObject
 */

const keyv = new Keyv('sqlite://db.sqlite');
keyv.on('error', (err) => console.error('Connection Error', err));

if (error) {
  console.error('Something wrong with env variables');
  process.exit();
}

// eslint-disable-next-line no-unused-vars
function logCtx(ctx) {
  if (env.DEBUG) {
    const writeCtx = JSON.parse(JSON.stringify(ctx));
    // noinspection JSConstantReassignment
    delete writeCtx.tg;
    console.info(JSON.stringify(writeCtx, null, 2));

    fs.writeFileSync('./last-ctx.json', `${JSON.stringify(writeCtx, null, 2)}\n`);
  }
}

(async () => {
  console.info('Waiting for the old instance to down...');
  await sleep(5000);
  console.info('Starting a new instance...');

  const startTime = new Date();

  const bot = new Telegraf(env.BOT_TOKEN);

  const localSession = new LocalSession({ database: 'telegraf-session.json' });

  const commandHandler = new CommandHandler(keyv, startTime);

  bot.use(localSession.middleware());
  bot.use((ctx, next) => {
    logCtx(ctx);

    if (!ctx.session) {
      if (env.DEBUG) {
        handleError(new Error('No session'), 'SESSION_ERROR');
      }
      return next();
    }

    if (ctx.botInfo?.id) {
      ctx.session.botId = ctx.botInfo?.id;
    }

    const addedMember = ctx?.update?.message?.new_chat_member;
    if (addedMember?.id === ctx.session.botId) {
      telegramUtil
        .getChatAdmins(bot, ctx.chat.id)
        .then(({ adminsString }) => {
          ctx
            .reply(
              joinMessage([
                'Привіт! 🇺🇦✌️',
                '',
                'Я чат-бот, який дозволяє автоматично видаляти повідомлення, що містять назви локацій міста, укриттів, а також ключові слова переміщення військ.',
                '',
                '<b>Зроби мене адміністратором, щоб я міг видаляти повідомлення.</b>',
                '',
                adminsString ? `Це може зробити: ${adminsString}` : 'Це може зробити творець чату',
              ]).trim(),
              { parse_mode: 'HTML' },
            )
            .catch(handleError);
        })
        .catch(handleError);
    }

    const chatTitle = ctx?.update?.my_chat_member?.chat?.title || ctx?.update?.message?.chat?.title;
    const chatType = ctx?.update?.my_chat_member?.chat?.type || ctx?.update?.message?.chat?.type;
    const isChannel = chatType === 'channel';
    const oldPermissionsMember = ctx?.update?.my_chat_member?.old_chat_member;
    const updatePermissionsMember = ctx?.update?.my_chat_member?.new_chat_member;
    const isUpdatedToAdmin = updatePermissionsMember?.user?.id === ctx.session.botId && updatePermissionsMember?.status === 'administrator';
    const isDemotedToMember =
      updatePermissionsMember?.user?.id === ctx.session.botId &&
      updatePermissionsMember?.status === 'member' &&
      oldPermissionsMember?.status === 'administrator';

    if (chatType) {
      ctx.session.chatType = chatType;
    }

    if (chatTitle) {
      ctx.session.chatTitle = chatTitle;
    }

    if (isUpdatedToAdmin) {
      ctx.session.isBotAdmin = true;
      if (isChannel) {
        ctx
          .reply(
            joinMessage([
              `Привіт! Повідомлення від офіційного чат-боту @${ctx.botInfo.username}.`,
              `Ви мене додали в <b>канал</b> як адміністратора, але я не можу перевіряти повідомлення в коментарях.`,
              '',
              'Видаліть мене і додайте в <b>чат каналу</b> каналу <b>як адміністратора</b>.',
              'Якщо є запитання, пишіть @dimkasmile',
            ]),
            { parse_mode: 'HTML' },
          )
          .catch(handleError);
      } else {
        ctx.reply('Тепер я адміністратор. Готовий до роботи 😎').catch(handleError);
      }
    }

    if (isDemotedToMember) {
      ctx.session.isBotAdmin = false;
      ctx.reply('Тепер я деактивований. Відпочиваю... 😴').catch(handleError);
    }

    if (ctx.session.isBotAdmin === undefined) {
      ctx.telegram
        .getChatMember(ctx.message.chat.id, ctx.botInfo.id)
        .catch(handleError)
        .then((member) => {
          ctx.session.isBotAdmin = member?.status === 'creator' || member?.status === 'administrator';
        });
    }

    if (ctx?.update?.message?.left_chat_participant?.id === ctx.session.botId) {
      ctx.session.botRemoved = true;
    } else {
      ctx.session.botRemoved = false;
    }

    if (ctx.chat.type === 'private') {
      return next();
    }

    try {
      if (ctx.session.botRemoved || !ctx.message) {
        return next();
      }

      // return next();

      return ctx.telegram
        .getChatMember(ctx.message.chat.id, ctx.message.from.id)
        .catch(handleError)
        .then((member) => {
          if (!member) {
            return next();
          }

          ctx.session.isCurrentUserAdmin = member.status === 'creator' || member.status === 'administrator';
          next();
        });
    } catch (e) {
      console.error(e);
      return next();
    }
  });

  bot.start((ctx) => {
    if (ctx?.update?.message?.chat?.type === 'private') {
      return ctx
        .reply(
          joinMessage([
            'Привіт! 🇺🇦✌️',
            '',
            'Я чат-бот, який дозволяє автоматично видаляти повідомлення, що містять назви локацій міста, укриттів, а також ключові слова переміщення військ.',
            '',
            '<b>Як мене запустити?</b>',
            '',
            'Додай мене і зроби адміністратором:',
            '• Або в звичайну групу;',
            '• Або в чат каналу.',
            '',
            'Якщо є запитання або бот не працює, пишіть @dimkasmile',
          ]),
          { parse_mode: 'HTML' },
        )
        .catch(handleError);
    }

    telegramUtil.getChatAdmins(bot, ctx.chat.id).then(({ adminsString }) => {
      ctx
        .reply(
          joinMessage([
            '<b>Зроби мене адміністратором, щоб я міг видаляти повідомлення.</b>',
            '',
            adminsString ? `Це може зробити: ${adminsString}` : 'Це може зробити творець чату',
          ]).trim(),
          { parse_mode: 'HTML' },
        )
        .catch((getAdminsError) => {
          handleError(getAdminsError);
          ctx.reply(joinMessage(['<b>Зроби мене адміністратором, щоб я міг видаляти повідомлення.</b>']), { parse_mode: 'HTML' });
        });
    });
  });
  bot.help((ctx) => {
    const startLocaleTime = startTime.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    ctx
      .reply(
        joinMessage([
          '<b>Якщо повідомлення було видалено помилково:</b>',
          '',
          '• Попросіть адміністраторів написати його самостійно;',
          '• Пришліть його скріншотом.',
          '',
          '<b>Останнє оновлення боту:</b>',
          '',
          startLocaleTime,
          '',
          'Якщо є запитання, пишіть @dimkasmile',
        ]),
        { parse_mode: 'HTML' },
      )
      .catch(handleError);
  });
  bot.command('/statistics', (ctx) => {
    if (ctx.chat.type === 'supergroup') {
    }
    try {
      /**
       * @type {SessionObject}
       * */
      const sessionObject = JSON.parse(fs.readFileSync('./telegraf-session.json').toString());
      const { sessions } = sessionObject;

      const currentBotSessions = sessions.filter((session) => session.data.botId === ctx.botInfo.id);

      const superGroupsSessions = currentBotSessions.filter((session) => session.data.chatType === 'supergroup');
      const groupSessions = currentBotSessions.filter((session) => session.data.chatType === 'group');
      const privateSessions = currentBotSessions.filter((session) => session.data.chatType === 'private');
      const channelSessions = currentBotSessions.filter((session) => session.data.chatType === 'channel');

      const totalSessionCount = currentBotSessions.length;
      const superGroupsCount = superGroupsSessions.length;
      const groupCount = groupSessions.length;
      const privateCount = privateSessions.length;
      const channelCount = channelSessions.length;

      const adminsChatsCount = [...superGroupsSessions, ...groupSessions].filter((session) => session.data.isBotAdmin).length;
      const memberChatsCount = [...superGroupsSessions, ...groupSessions].filter((session) => !session.data.isBotAdmin).length;
      const botRemovedCount = [...superGroupsSessions, ...groupSessions].filter((session) => session.data.botRemoved).length;

      ctx.reply(
        getStatisticsMessage({
          adminsChatsCount,
          botRemovedCount,
          botStartTime: startTime,
          channelCount,
          groupCount,
          memberChatsCount,
          privateCount,
          superGroupsCount,
          totalSessionCount,
        }),
        { parse_mode: 'HTML' },
      );
    } catch (e) {
      handleError(e);
      ctx.reply('Cannot get statistics');
    }
  });
  bot.command('/session', commandHandler.onSessionHandler.bind(commandHandler));

  bot.catch(handleError);

  const perfomanceMiddleware = (ctx, next) => {
    if (env.DEBUG) {
      ctx
        .replyWithMarkdown(
          `*Time*: ${performance.now() - ctx.session.performanceStart}\n\nStart:\n${
            ctx.session.performanceStart
          }\n\nEnd:\n${performance.now()}`,
        )
        .catch(handleError)
        .then(() => next());
    } else {
      return next();
    }
  };

  bot.on('text', commandHandler.onMessageHandler.bind(commandHandler), perfomanceMiddleware);
  // bot.on('text', () => {});
  bot.launch().then(() => {
    console.info('Bot started!', new Date().toString());
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
