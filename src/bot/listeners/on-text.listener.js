const { env } = require('typed-dotenv').config();

const { telegramUtil, truncateString } = require('../../utils');
const { getDeleteMessage, getDebugMessage, spamDeleteMessage } = require('../../message');
const { getMessageReputation } = require('../spam.handlers');

class OnTextListener {
  /**
   * @param {Keyv} keyv
   * @param {Date} startTime
   */
  constructor(keyv, startTime) {
    this.keyv = keyv;
    this.startTime = startTime;
  }

  /**
   * Handles every received message
   * */
  middleware() {
    /**
     * @param {TelegrafContext} ctx
     * @param {Next} next
     * */
    return async (ctx, next) => {
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
            debugMessage = getDebugMessage({ message, byRules: rep.byRules, startTime: this.startTime });
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

            .then(() => {
              ctx.reply(getDeleteMessage({ writeUsername, wordMessage, debugMessage }));
            });
        } catch (e) {
          console.error('Cannot delete the message. Reason:', e);
        }
      }

      if (rep.reputation <= 0 || (rep.userRep <= 0 && !env.DISABLE_USER_REP)) {
        try {
          await ctx
            .deleteMessage()

            .then(() => {
              ctx.reply(spamDeleteMessage);
            });
        } catch (e) {
          console.error('Cannot delete the message. Reason:', e);
        }
      }

      return next();
    };
  }
}

module.exports = {
  OnTextListener,
};
