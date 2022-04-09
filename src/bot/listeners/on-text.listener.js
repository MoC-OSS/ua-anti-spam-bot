const { env } = require('typed-dotenv').config();

const { creatorId } = require('../../creator');

const { telegramUtil } = require('../../utils');
const { getDeleteMessage, getDebugMessage } = require('../../message'); // spamDeleteMessage
const { getMessageReputation } = require('../spam.handlers');

// const slavaWords = ['слава україні', 'слава украине', 'слава зсу'];

class OnTextListener {
  /**
   * @param {Keyv} keyv
   * @param {Date} startTime
   * @param {MessageHandler} messageHandler
   */
  constructor(keyv, startTime, messageHandler) {
    this.keyv = keyv;
    this.startTime = startTime;
    this.messageHandler = messageHandler;
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

      const rep = await getMessageReputation(ctx, this.keyv, this.messageHandler);

      if (rep.byRules.dataset) {
        ctx.state.dataset = rep.byRules.dataset;

        if (ctx.chat.id === creatorId) {
          ctx.reply(JSON.stringify(rep.byRules.dataset, null, 2));
        }
      }

      if (rep.byRules?.rule) {
        try {
          const username = ctx.from?.username;
          const fullName = ctx.from?.last_name ? `${ctx.from?.first_name} ${ctx.from?.last_name}` : ctx.from?.first_name;
          const writeUsername = username ? `@${username}` : fullName ?? '';

          let debugMessage = '';

          if (env.DEBUG) {
            debugMessage = getDebugMessage({ message, byRules: rep.byRules, startTime: this.startTime });
          }

          await ctx.deleteMessage().then(() => {
            ctx.replyWithHTML(
              getDeleteMessage({ writeUsername, wordMessage: '', debugMessage, withLocation: rep.byRules.dataset.location }),
            );
          });
        } catch (e) {
          console.error('Cannot delete the message. Reason:', e);
        }
      }

      /*
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
      */

      return next();
    };
  }
}

module.exports = {
  OnTextListener,
};
