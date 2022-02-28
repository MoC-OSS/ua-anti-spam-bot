const { error, env } = require('typed-dotenv').config();
const { Telegraf } = require('telegraf');
const GraphemeSplitter = require('grapheme-splitter');
const containsEmoji = require('contains-emoji');
const lodashGet = require('lodash.get');
const Keyv = require('keyv');

const { messageUtil, telegramUtil } = require('./utils');
const rules = require('../dataset/rules.json');
const getChatWhitelist = require('./chat-whitelist');

const splitter = new GraphemeSplitter();
const keyv = new Keyv('sqlite://db.sqlite');
keyv.on('error', (err) => console.error('Connection Error', err));

if (error) {
  console.error('Something wrong with env variables');
  process.exit();
}

const startTime = new Date().toString();

const CHAT_WHITELIST = getChatWhitelist(env);

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
  if (!ctx?.message?.chat?.id || !CHAT_WHITELIST.includes(ctx.message.chat.id)) {
    console.error(Date.toString(), 'Cannot access the chat:', ctx.message.chat);
    return false;
  }

  if (env.ONLY_WORK_IN_COMMENTS && !telegramUtil.isInComments(ctx)) {
    return false;
  }

  const rep = await getMessageReputation(ctx);
  const message = telegramUtil.getMessage(ctx);

  if (rep.byRules?.rule) {
    try {
      const username = ctx?.update?.message?.from?.username;
      const writeUsername = username ? `@${username}` : '';

      await ctx.deleteMessage();
      await ctx.reply(
        `${
          `❗️ ${writeUsername} Повідомлення видалено.\n\n* Причина: повідомлення стратегічних цілей.\n\nЯкщо ви не впевнені, що це був ворог, був розроблений спеціальний чат-бот для повідомлення таких новин - https://t.me/ne_nashi_bot` +
          '\n\n\nDEBUG: \nПовідомлення:\n'
        }${message}\n\nПравило бана:\n${JSON.stringify(rep.byRules)}\n\nОстанній деплой:\n${startTime}`,
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
bot.start((ctx) => ctx.reply('WIP'));
bot.help((ctx) => ctx.reply(`Запущений:\n\n${startTime}`));
bot.on('text', onMessage);
bot.launch().then(() => {
  console.info('Bot started!', new Date().toString());
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
