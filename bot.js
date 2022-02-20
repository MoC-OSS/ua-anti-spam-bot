const { error, env } = require('typed-dotenv').config();
const { Telegraf } = require('telegraf');

const GraphemeSplitter = require('grapheme-splitter');
const splitter = new GraphemeSplitter();
const containsEmoji = require("contains-emoji");

const Keyv = require('keyv');
const keyv = new Keyv('sqlite://db.sqlite');
keyv.on('error', err => console.error('Connection Error', err));


if (error) {
  console.error("Something wrong with env variables");
  process.exit();
}

const isFromChannel = ctx =>
  ctx?.message?.from?.first_name === 'Channel' && ctx?.message?.from?.username === 'Channel_Bot';

const isInComments = ctx =>
  ctx?.message?.reply_to_message?.from?.id === 777000;

const countEmojis = ctx =>
  splitter.splitGraphemes(ctx?.message?.text || '').filter(e => containsEmoji(e)).length;

const countUrls = ctx =>
  (ctx?.message?.entities || []).filter(e => e.type === 'url').length;

const formattingsInfo = ctx => {
  const formattings = (ctx?.message?.entities || []).filter(e => e.type !== 'url');
  return {
    length: formattings.reduce((a, e) => a + e.length, 0),
    count: formattings.length
  }
}

const getMessageReputation = async ctx => {
  const emojis = countEmojis(ctx);
  const formattings = formattingsInfo(ctx);
  const urls = countUrls(ctx);
  const fromChannel = isFromChannel(ctx);

  let userRep = fromChannel ? env.CHANNEL_START_REPUTATION : parseInt(await keyv.get(`user_${ctx.from.id}`)) || env.START_REPUTATION;

  userRep += formattings.count * env.FORMATTINGS_REPUTATION
    + emojis * env.EMOJI_REPUTATION
    + urls * env.URLS_REPUTATION
    + env.NEW_MESSAGE_REPUTATION;

  if (!fromChannel)
    await keyv.set(`user_${ctx.from.id}`, userRep);

  const reputation =
    env.START_MSG_REPUTATION
    + formattings.count * env.FORMATTINGS_MSG_REPUTATION
    + emojis * env.EMOJI_MSG_REPUTATION
    + urls * env.URLS_MSG_REPUTATION
    + (fromChannel ? env.CHANNEL_MSG_REPUTATION : 0);

  return { emojis, formattings, urls, fromChannel, reputation, userRep };
}

const onMessage = async ctx => {
  if (!ctx?.message?.chat?.id || !env.CHAT_WHITELIST.includes(ctx.message.chat.id))
    return;
  
  if (env.ONLY_WORK_IN_COMMENTS && !isInComments(ctx))
    return;
  
  const rep = await getMessageReputation(ctx);

  if (rep.reputation <= 0 || (rep.userRep <= 0 && env.DISABLE_USER_REP))
    return ctx.deleteMessage();
}

const bot = new Telegraf(env.BOT_TOKEN);
bot.start((ctx) => ctx.reply('WIP'));
bot.help((ctx) => ctx.reply('WIP'));
bot.on('text', onMessage);
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
