const fs = require('fs');

const { env } = require('typed-dotenv').config();
const containsEmoji = require('contains-emoji');
const GraphemeSplitter = require('grapheme-splitter');

const { messageHandler } = require('./message.handler');
const { creatorId } = require('../creator');
const { blockMessage } = require('../message');
const { telegramUtil, handleError } = require('../utils');

/**
 * @typedef { import("telegraf").Context } TelegrafContext
 */

const splitter = new GraphemeSplitter();

const isFilteredByRules = (ctx) => {
  const originMessage = telegramUtil.getMessage(ctx);
  const message = messageHandler.sanitizeMessage(ctx, originMessage);

  return messageHandler.getDeleteRule(message, originMessage);
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

const getMessageReputation = async (ctx, keyv) => {
  const emojis = countEmojis(ctx);
  const formattings = formattingsInfo(ctx);
  const urls = countUrls(ctx);
  const fromChannel = telegramUtil.isFromChannel(ctx);
  const byRules = await isFilteredByRules(ctx);

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

function truncateString(str, num) {
  if (str.length > num) {
    return `${str.slice(0, num)}..`;
  }
  return str;
}

class CommandHandler {
  /**
   * @param {KeyV} keyv
   * @param {Date} startTime
   * */
  constructor(keyv, startTime) {
    this.keyv = keyv;
    this.startTime = startTime;
  }

  /**
   * @callback Next
   * @returns Promise<void>
   */

  /**
   * Handles every received message
   *
   * @param {TelegrafContext} ctx
   * @param {Next} next
   * */
  async onMessageHandler(ctx, next) {
    if (env.DEBUG) {
      ctx.session.performanceStart = performance.now();
    }
    /**
     * Skip channel post when bot in channel
     * @deprecated on message doesn't handle user posts
     * */
    // if (ctx?.update?.channel_post?.sender_chat?.type === 'channel') {
    //   return;
    // }

    /**
     * Skip channel admins message duplicated in chat
     * */
    if (ctx?.update?.message?.sender_chat?.type === 'channel') {
      return next();
    }

    /**
     * Skip channel chat admins message
     * */
    if (ctx?.update?.message?.from?.username === 'GroupAnonymousBot') {
      return next();
    }

    if (ctx.session?.botRemoved) {
      return next();
    }

    if (!ctx?.message?.chat?.id) {
      console.error(Date.toString(), 'Cannot access the chat:', ctx.message.chat);
      return next();
    }

    if (env.ONLY_WORK_IN_COMMENTS && !telegramUtil.isInComments(ctx)) {
      return next();
    }

    if (ctx.session?.isCurrentUserAdmin && !env.DEBUG) {
      return next();
    }

    const rep = await getMessageReputation(ctx, this.keyv);
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
            '***DEBUG***',
            'Message:',
            message,
            '',
            'Ban reason:',
            JSON.stringify(rep.byRules),
            '',
            'Logic type:',
            env.USE_SERVER ? 'server' : 'local',
            '',
            'Last deploy:',
            this.startTime.toString(),
          ].join('\n');
        }

        let words = rep.byRules.dataset === 'immediately' ? [] : [rep.byRules.rule];

        words = words.map((word) => word.trim()).filter(Boolean);
        words = words.map((word) => {
          const newWordArray = word.split('');

          for (let i = 1; i < word.length; i += 2) {
            newWordArray[i] = '*';
          }

          return truncateString(newWordArray.join(''), 4);
        });

        const wordMessage = words.length ? ` (${words.join(', ')})` : '';

        await ctx
          .deleteMessage()
          .catch(handleError)
          .then(() => {
            ctx
              .reply(
                `❗️ ${writeUsername} Повідомлення видалено.\n\n* Причина: поширення потенційно стратегічної інформації${wordMessage}.\n\nСповіщайте про ворогів спеціальному боту: @stop_russian_war_bot\n\n${blockMessage}${debugMessage}`,
              )
              .catch(handleError);
          });
      } catch (e) {
        console.error('Cannot delete the message. Reason:', e);
      }
    }

    if (rep.reputation <= 0 || (rep.userRep <= 0 && !env.DISABLE_USER_REP)) {
      try {
        await ctx
          .deleteMessage()
          .catch(handleError)
          .then(() => {
            ctx.reply('❗️ Повідомлення видалено.\n\n* Причина: спам.\n\n').catch(handleError);
          });
      } catch (e) {
        console.error('Cannot delete the message. Reason:', e);
      }
    }

    return next();
  }

  /**
   * Handle /session
   * Returns session file
   *
   * @param {TelegrafContext} ctx
   * */
  async onSessionHandler(ctx) {
    const chatId = ctx?.update?.message?.chat?.id;

    if (chatId === creatorId) {
      const sessionObjectBuffer = fs.readFileSync('./telegraf-session.json');
      ctx
        .replyWithDocument({ source: sessionObjectBuffer, filename: `telegraf-session-${this.startTime.toISOString()}.json` })
        .catch(handleError);
    }
  }
}

module.exports = {
  CommandHandler,
};
