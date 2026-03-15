import type { Message } from '@grammyjs/types';
import type { Context, NextFunction } from 'grammy';

import type { ParseMode } from 'typegram';

import { logger } from '@utils/logger';

export type SelfDestructedFlavor<TContext extends Context> = TContext & {
  replyWithSelfDestructed: TContext['reply'];
  replyWithSelfDestructedHTML: TContext['reply'];
  replyWithSelfDestructedMarkdown: TContext['reply'];
  replyWithSelfDestructedMarkdownV1: TContext['reply'];
  replyWithSelfDestructedMarkdownV2: TContext['reply'];
  replyWithPhotoWithSelfDestructedHTML: TContext['replyWithPhoto'];
};

/**
 * Default callback.
 * Just removes the sent message.
 * */
const defaultDeleteCallback = async <TContext extends Context>(
  context: TContext,
  replyResult: Message.PhotoMessage | Message.TextMessage,
) => {
  await context.api.deleteMessage(replyResult.chat.id, replyResult.message_id);
};

export type SelfDestructedCallback = typeof defaultDeleteCallback;

/**
 * Build delete reply with parse modes
 * */
const buildReplyWithParseMode =
  <TContext extends Context>(
    context: SelfDestructedFlavor<TContext>,
    timeout: number,
    callback: SelfDestructedCallback,
    parseMode?: ParseMode,
  ): TContext['reply'] =>
  async (text, other, signal) => {
    const otherParameters = parseMode ? { ...other, parse_mode: parseMode } : other;
    const replyResult = await context.reply(text, otherParameters, signal);

    setTimeout(() => {
      callback(context, replyResult).catch((error) => {
        logger.error('Cannot self destruct the message. Error:', error);
      });
    }, timeout);

    return replyResult;
  };

/**
 * Build delete reply with parse modes
 * */
const buildReplyPhotoWithParseMode =
  <TContext extends Context>(
    context: SelfDestructedFlavor<TContext>,
    timeout: number,
    callback: SelfDestructedCallback,
    parseMode?: ParseMode,
  ): TContext['replyWithPhoto'] =>
  async (text, other, signal) => {
    const otherParameters = parseMode ? { ...other, parse_mode: parseMode } : other;
    const replyResult = await context.replyWithPhoto(text, otherParameters, signal);

    setTimeout(() => {
      callback(context, replyResult).catch((error) => {
        logger.error('Cannot self destruct the message. Error:', error);
      });
    }, timeout);

    return replyResult;
  };

// eslint-disable-next-line no-secrets/no-secrets
/**
 * Delete message after specified timeout.
 *
 * @param timeout - timeout to wait before delete the sent message
 * @param callback - custom callback to call when message should be deleted
 *
 * @returns a regular grammy middleware
 *
 * @example
 * ```ts
 * type AppContext = ReplyWithSelfDestructedMessageFlavor<Context>;
 *
 * const bot = new Bot<AppContext>('token');
 *
 * // 1) Use default plugin
 * bot.use(selfDestructedReply()); // will be deleted after 1 min
 *
 * // 2) Or timeout config
 * bot.use(selfDestructedReply(10_000)); // will be deleted after 10 sec
 *
 * // 3) Or timeout config with custom delete callback
 * bot.use(selfDestructedReply(10_000, async (context, replyResult) => {
 *   await context.api.deleteMessage(replyResult.chat.id, replyResult.message_id);
 *   await context.api.sendMessage('Deleted!');
 * }));
 *
 * bot.on(':text', (context) => context.replyWithSelfDestructedMessage('text'));
 * ```
 * */
export const selfDestructedReply =
  (timeout = 60_000, callback: SelfDestructedCallback = defaultDeleteCallback) =>
  <TContext extends Context>(context: SelfDestructedFlavor<TContext>, next: NextFunction) => {
    context.replyWithSelfDestructed = buildReplyWithParseMode(context, timeout, callback);
    context.replyWithSelfDestructedHTML = buildReplyWithParseMode(context, timeout, callback, 'HTML');
    context.replyWithSelfDestructedMarkdown = buildReplyWithParseMode(context, timeout, callback, 'MarkdownV2');
    context.replyWithSelfDestructedMarkdownV1 = buildReplyWithParseMode(context, timeout, callback, 'Markdown');
    context.replyWithSelfDestructedMarkdownV2 = buildReplyWithParseMode(context, timeout, callback, 'MarkdownV2');
    context.replyWithPhotoWithSelfDestructedHTML = buildReplyPhotoWithParseMode(context, timeout, callback, 'HTML');

    return next();
  };
