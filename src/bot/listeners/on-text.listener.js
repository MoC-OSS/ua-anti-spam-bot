const { env } = require('typed-dotenv').config();

const { telegramUtil, truncateString } = require('../../utils');
const { getDeleteMessage, getDebugMessage, spamDeleteMessage } = require('../../message');
const { getMessageReputation } = require('../spam.handlers');

// const slavaWords = ['слава україні', 'слава украине', 'слава зсу'];

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
     * @param {GrammyContext} ctx
     * @param {Next} next
     * */
    return async (ctx, next) => {
      if (env.DEBUG) {
        ctx.state.performanceStart = performance.now();
      }

      /**
       * Skip messages before bot became admin
       * */
      if (ctx.msg?.date * 1000 < +ctx.session.botAdminDate) {
        return next();
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
      if (ctx.chat?.type === 'channel') {
        return next();
      }

      const message = ctx.msg.text;

      /**
       * Removed because Denis Gajda ask to reduce chat messages
       * */
      // if (slavaWords.some((word) => message.toLowerCase().includes(word.toLowerCase()))) {
      //   ctx.reply('Героям Слава! 🇺🇦', { reply_to_message_id: ctx?.update?.message?.message_id });
      // }

      /**
       * Skip channel chat admins message
       * */
      if (ctx.from?.username === 'GroupAnonymousBot') {
        return next();
      }

      if (!ctx.chat?.id) {
        console.error(Date.toString(), 'Cannot access the chat:', ctx.chat);
        return next();
      }

      if (env.ONLY_WORK_IN_COMMENTS && !telegramUtil.isInComments(ctx)) {
        return next();
      }

      if (ctx.session?.isCurrentUserAdmin && !env.DEBUG) {
        return next();
      }

      const rep = await getMessageReputation(ctx, this.keyv);

      if (rep.byRules?.rule) {
        try {
          const username = ctx.from?.username;
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
