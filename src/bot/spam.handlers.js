const { env } = require('typed-dotenv').config();
const containsEmoji = require('contains-emoji');
const GraphemeSplitter = require('grapheme-splitter');

const { telegramUtil } = require('../utils');

const splitter = new GraphemeSplitter();

/**
 * @param {GrammyContext} ctx
 * @param {MessageHandler} messageHandler
 */
const isFilteredByRules = async (ctx, messageHandler) => {
  const originMessage = ctx.state.text;
  const message = messageHandler.sanitizeMessage(ctx, originMessage);
  /**
   * Adapter for tensor
   * */
  const result = await messageHandler.getTensorRank(message, originMessage);

  return {
    rule: result.isSpam ? 'tensor' : null,
    dataset: result,
  };

  // Hid old logic
  // return messageHandler.getDeleteRule(message, originMessage);
};

/**
 * @param {GrammyContext} ctx
 */
const countEmojis = (ctx) => splitter.splitGraphemes(ctx.state.text || '').filter((e) => containsEmoji(e)).length;

/**
 * @param {GrammyContext} ctx
 */
const countUrls = (ctx) => (ctx.msg?.entities || []).filter((e) => e.type === 'url').length;

/**
 * @param {GrammyContext} ctx
 */
const formattingsInfo = (ctx) => {
  const formattings = (ctx.msg?.entities || []).filter((e) => e.type !== 'url');
  return {
    length: formattings.reduce((a, e) => a + e.length, 0),
    count: formattings.length,
  };
};

/**
 * @param {GrammyContext} ctx
 * @param {Keyv} keyv
 * @param {MessageHandler} messageHandler
 */
const getMessageReputation = async (ctx, keyv, messageHandler) => {
  const emojis = countEmojis(ctx);
  const formattings = formattingsInfo(ctx);
  const urls = countUrls(ctx);
  const fromChannel = telegramUtil.isFromChannel(ctx);
  const byRules = await isFilteredByRules(ctx, messageHandler);

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

module.exports = {
  getMessageReputation,
};
