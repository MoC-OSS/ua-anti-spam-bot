import type { Message } from '@grammyjs/types';
import type { Context, NextFunction } from 'grammy';
import type { ParseMode } from 'typegram';

export type SelfDestructedFlavor<C extends Context> = C & {
  replyWithSelfDestructed: C['reply'];
  replyWithSelfDestructedHTML: C['reply'];
  replyWithSelfDestructedMarkdown: C['reply'];
  replyWithSelfDestructedMarkdownV1: C['reply'];
  replyWithSelfDestructedMarkdownV2: C['reply'];
};

/**
 * Default callback.
 * Just removes the sent message.
 * */
const defaultDeleteCallback = async <C extends Context>(context: C, replyResult: Message.TextMessage) => {
  await context.api.deleteMessage(replyResult.chat.id, replyResult.message_id);
};

export type SelfDestructedCallback = typeof defaultDeleteCallback;

/**
 * Build delete reply with parse modes
 * */
const buildReplyWithParseMode =
  <C extends Context>(
    context: SelfDestructedFlavor<C>,
    timeout: number,
    callback: SelfDestructedCallback,
    parseMode?: ParseMode,
  ): C['reply'] =>
  async (text, other, signal) => {
    const otherParameters = parseMode ? { ...other, parse_mode: parseMode } : other;
    const replyResult = await context.reply(text, otherParameters, signal);

    setTimeout(() => {
      callback(context, replyResult).catch((error) => {
        console.error('Cannot self destruct the message. Error:', error);
      });
    }, timeout);

    return replyResult;
  };

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
  <C extends Context>(context: SelfDestructedFlavor<C>, next: NextFunction) => {
    context.replyWithSelfDestructed = buildReplyWithParseMode(context, timeout, callback);
    context.replyWithSelfDestructedHTML = buildReplyWithParseMode(context, timeout, callback, 'HTML');
    context.replyWithSelfDestructedMarkdown = buildReplyWithParseMode(context, timeout, callback, 'MarkdownV2');
    context.replyWithSelfDestructedMarkdownV1 = buildReplyWithParseMode(context, timeout, callback, 'Markdown');
    context.replyWithSelfDestructedMarkdownV2 = buildReplyWithParseMode(context, timeout, callback, 'MarkdownV2');

    return next();
  };
