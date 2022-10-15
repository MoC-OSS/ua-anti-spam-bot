import containsEmoji from 'contains-emoji';
import GraphemeSplitter from 'grapheme-splitter';
import type Keyv from 'keyv';

import { environmentConfig } from '../config';
import type { GrammyContext } from '../types';
import { telegramUtil } from '../utils';

import type { MessageHandler } from './message.handler';

const splitter = new GraphemeSplitter();

/**
 * @param {GrammyContext} context
 * @param {MessageHandler} messageHandler
 */
const isFilteredByRules = async (context: GrammyContext, messageHandler: MessageHandler) => {
  const originMessage = context.state.text;
  const message = messageHandler.sanitizeMessage(context, originMessage || '');
  /**
   * Adapter for tensor
   * */
  const result = await messageHandler.getTensorRank(message, originMessage || '');

  return {
    rule: result.isSpam ? 'tensor' : null,
    dataset: result,
  };

  // Hid old logic
  // return messageHandler.getDeleteRule(message, originMessage);
};

/**
 * @param {GrammyContext} context
 */
const countEmojis = (context: GrammyContext) =>
  splitter.splitGraphemes(context.state.text || '').filter((entity) => containsEmoji(entity)).length;

/**
 * @param {GrammyContext} context
 */
const countUrls = (context: GrammyContext) => (context.msg?.entities || []).filter((entity) => entity.type === 'url').length;

/**
 * @param {GrammyContext} context
 */
const formattingsInfo = (context: GrammyContext) => {
  const formattings = (context.msg?.entities || []).filter((entity) => entity.type !== 'url');
  return {
    length: formattings.reduce((a, entity) => a + entity.length, 0),
    count: formattings.length,
  };
};

/**
 * @param {GrammyContext} context
 * @param {Keyv} keyv
 * @param {MessageHandler} messageHandler
 */
export const getMessageReputation = async (context: GrammyContext, keyv: Keyv, messageHandler: MessageHandler) => {
  const emojis = countEmojis(context);
  const formattings = formattingsInfo(context);
  const urls = countUrls(context);
  const fromChannel = telegramUtil.isFromChannel(context);
  const byRules = await isFilteredByRules(context, messageHandler);

  let userRep = fromChannel
    ? environmentConfig.CHANNEL_START_REPUTATION
    : Number.parseInt((await keyv.get(`user_${context.from?.id || ''}`)) as string, 10) || environmentConfig.START_REPUTATION;

  userRep +=
    formattings.count * environmentConfig.FORMATTINGS_REPUTATION +
    emojis * environmentConfig.EMOJI_REPUTATION +
    urls * environmentConfig.URLS_REPUTATION +
    environmentConfig.NEW_MESSAGE_REPUTATION;

  if (!fromChannel) await keyv.set(`user_${context?.from?.id || ''}`, userRep);

  const reputation =
    environmentConfig.START_MSG_REPUTATION +
    formattings.count * environmentConfig.FORMATTINGS_MSG_REPUTATION +
    emojis * environmentConfig.EMOJI_MSG_REPUTATION +
    urls * environmentConfig.URLS_MSG_REPUTATION +
    (fromChannel ? environmentConfig.CHANNEL_MSG_REPUTATION : 0);

  return { emojis, formattings, urls, fromChannel, reputation, userRep, byRules };
};
