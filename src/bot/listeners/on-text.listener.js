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
      // TODO use for ctx prod debug
      // console.info('enter onText ******', ctx.chat?.title, '******', ctx.state.text);

      /**
       * Skip messages before bot became admin
       * */
      if ((ctx.msg?.date || 0) * 1000 < +ctx.session.botAdminDate) {
        return next();
      }

      const message = ctx.state.text;

      /**
       * Removed because ask to reduce chat messages
       * */
      // if (slavaWords.some((word) => message.toLowerCase().includes(word.toLowerCase()))) {
      //   ctx.reply('Героям Слава! 🇺🇦', { reply_to_message_id: ctx?.update?.message?.message_id });
      // }

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
          const fullName = ctx.from?.last_name ? `${ctx.from?.first_name} ${ctx.from?.last_name}` : ctx.from?.first_name;
          const writeUsername = username ? `@${username}` : fullName ?? '';

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
