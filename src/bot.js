const { error, env } = require('typed-dotenv').config();
const { Telegraf } = require('telegraf');
const GraphemeSplitter = require('grapheme-splitter');
const containsEmoji = require('contains-emoji');
const lodashGet = require('lodash.get');
const LocalSession = require('telegraf-session-local');
const Keyv = require('keyv');

const { messageUtil, telegramUtil } = require('./utils');
const rules = require('../dataset/rules.json');

const splitter = new GraphemeSplitter();
const keyv = new Keyv('sqlite://db.sqlite');
keyv.on('error', (err) => console.error('Connection Error', err));

if (error) {
  console.error('Something wrong with env variables');
  process.exit();
}

function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

(async () => {
  console.info('Waiting for the old instance to down...');
  await sleep(5000);
  console.info('Starting a new instance...');

  const startTime = new Date().toString();

  const isFilteredByRules = (ctx) => {
    const message = telegramUtil.getMessage(ctx);

    if (!message) {
      console.error('Cannot parse the message!', ctx);
      return false;
    }

    const deleteRule = {
      rule: null,
      parsedRule: null,
      type: '',
    };

    const strictPercent100 = rules.dataset.strict_percent_100.find((percent1000) => messageUtil.findInText(message, percent1000, true));

    if (strictPercent100) {
      deleteRule.rule = 'STRICT 100 процентів бан';
      deleteRule.parsedRule = strictPercent100;

      return deleteRule;
    }

    const percent100 = rules.dataset.percent_100.find((percent1000) => messageUtil.findInText(message, percent1000));

    if (percent100) {
      deleteRule.rule = '100 процентів бан';
      deleteRule.parsedRule = percent100;

      return deleteRule;
    }

    deleteRule.rule = rules.rules.some((rule) => {
      if (rule.and) {
        deleteRule.type = 'and';
        const andCondition = !rule.and.some((filterText) => {
          const da5 = messageUtil.findInText(message, filterText);

          if (da5) {
            deleteRule.parsedRule = filterText;
          }

          return da5;
        });
        return messageUtil.isHit(andCondition, rule, message);
      }

      if (rule.array_and) {
        deleteRule.type = 'array_and';
        const andArray = lodashGet(rules, rule.array_and.replace('_$', ''));

        return andArray.some((filterText) => {
          const andCondition = messageUtil.findInText(message, filterText);
          const da = messageUtil.isHit(andCondition, rule, message);

          if (da.result) {
            deleteRule.parsedRule = {
              andCondition: filterText,
              orCondition: da.findText,
              orType: da.orType,
            };
            return true;
          }

          return false;
        });
      }

      return false;
    });

    return deleteRule;
  };

  const countEmojis = (ctx) => splitter.splitGraphemes(ctx?.message?.text || '').filter((e) => containsEmoji(e)).length;

  const countUrls = (ctx) => (ctx?.message?.entities || []).filter((e) => e.type === 'url').length;

  const formattingsInfo = (ctx) => {
    const formattings = (ctx?.message?.entities || []).filter((e) => e.type !== 'url');
    return {
      length: formattings.reduce((a, e) => a + e.length, 0),
      count: formattings.length,
    };
  };

  const getMessageReputation = async (ctx) => {
    const emojis = countEmojis(ctx);
    const formattings = formattingsInfo(ctx);
    const urls = countUrls(ctx);
    const fromChannel = telegramUtil.isFromChannel(ctx);
    const byRules = isFilteredByRules(ctx);

    let userRep = fromChannel ? env.CHANNEL_START_REPUTATION : parseInt(await keyv.get(`user_${ctx.from.id}`), 10) || env.START_REPUTATION;

    userRep +=
      formattings.count * env.FORMATTINGS_REPUTATION +
      emojis * env.EMOJI_REPUTATION +
      urls * env.URLS_REPUTATION +
      env.NEW_MESSAGE_REPUTATION;

    if (!fromChannel) await keyv.set(`user_${ctx.from.id}`, userRep);

    const reputation =
      env.START_MSG_REPUTATION +
      formattings.count * env.FORMATTINGS_MSG_REPUTATION +
      emojis * env.EMOJI_MSG_REPUTATION +
      urls * env.URLS_MSG_REPUTATION +
      (fromChannel ? env.CHANNEL_MSG_REPUTATION : 0);

    return { emojis, formattings, urls, fromChannel, reputation, userRep, byRules };
  };

  const onMessage = async (ctx) => {
    if (ctx.session?.botRemoved) {
      return;
    }

    if (!ctx?.message?.chat?.id) {
      console.error(Date.toString(), 'Cannot access the chat:', ctx.message.chat);
      return false;
    }

    if (env.ONLY_WORK_IN_COMMENTS && !telegramUtil.isInComments(ctx)) {
      return false;
    }

    if (ctx.session?.isCurrentUserAdmin && !env.DEBUG) {
      return false;
    }

    const rep = await getMessageReputation(ctx);
    const message = telegramUtil.getMessage(ctx);

    if (rep.byRules?.rule) {
      try {
        const username = ctx?.update?.message?.from?.username;
        const writeUsername = username ? `@${username}` : '';

        let debugMessage = '';

        if (env.DEBUG) {
          debugMessage = [
            '',
            '',
            '',
            'DEBUG:',
            'Повідомлення:',
            message,
            '',
            'Правило бану:',
            JSON.stringify(rep.byRules),
            '',
            'Останній деплой:',
            startTime,
          ].join('\n');
        }

        await ctx.deleteMessage();
        await ctx.reply(
          `❗️ ${writeUsername} Повідомлення видалено.\n\n* Причина: поширення потенційно стратегічної інформації.\n\nСповіщайте про ворогів спеціальному боту: @stop_russian_war_bot${debugMessage}`,
        );
      } catch (e) {
        console.error('Cannot delete the message. Reason:', e);
      }
    }

    if (rep.reputation <= 0 || (rep.userRep <= 0 && !env.DISABLE_USER_REP)) {
      try {
        await ctx.deleteMessage();
        await ctx.reply('❗️ Повідомлення видалено.\n\n* Причина: спам.\n\n');
      } catch (e) {
        console.error('Cannot delete the message. Reason:', e);
      }
    }

    return false;
  };

  const bot = new Telegraf(env.BOT_TOKEN);

  bot.start((ctx) => ctx.reply('Зроби мене адміністратором, щоб я міг видаляти повідомлення.'));
  bot.help((ctx) => ctx.reply(`Бот був запущений:\n\n${startTime}`));

  const localSession = new LocalSession({ database: 'telegraf-session.json' });

  bot.use(localSession.middleware());

  bot.use((ctx, next) => {
    if (!ctx.session) {
      return;
    }

    if (ctx.botInfo?.id) {
      ctx.session.botId = ctx.botInfo?.id;
    }

    const addedMember = ctx?.update?.message?.new_chat_member;
    if (addedMember?.id === ctx.session.botId) {
      ctx.reply('Привіт!\nЗроби мене адміністратором, щоб я міг видаляти повідомлення.');
    }

    const updatePermissionsMember = ctx?.update?.my_chat_member?.new_chat_member;
    if (updatePermissionsMember?.user?.id === ctx.session.botId && updatePermissionsMember?.status === 'administrator') {
      ctx.reply('Тепер я адміністратор. Готовий до роботи 😎');
    }

    if (ctx?.update?.message?.left_chat_participant?.id === ctx.session.botId) {
      ctx.session.botRemoved = true;
    } else {
      ctx.session.botRemoved = false;
    }

    if (!ctx.session.chats) {
      ctx.session.chats = {};
    }

    if (ctx.chat.type === 'private') {
      return next();
    }

    try {
      if (ctx.session.botRemoved) {
        return;
      }

      return ctx.telegram
        .getChatMember(ctx.message.chat.id, ctx.message.from.id)
        .catch(console.error)
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

  bot.on('text', onMessage);
  // bot.on('text', () => {});
  bot.launch().then(() => {
    console.info('Bot started!', new Date().toString());
  });

  bot.catch((botError) => {
    console.error('*** HANDLED ERROR: ***', botError);
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
