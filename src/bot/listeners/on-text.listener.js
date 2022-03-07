const { env } = require('typed-dotenv').config();

const { blockMessage } = require('../../message');
const { telegramUtil, truncateString, handleError } = require('../../utils');
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
    };
  }
}

module.exports = {
  OnTextListener,
};
