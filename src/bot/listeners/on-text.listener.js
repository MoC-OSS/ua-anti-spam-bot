const { env } = require('typed-dotenv').config();
const { InputFile } = require('grammy');

const { creatorId, privateTrainingChat, logsChat } = require('../../creator');

const { redisService } = require('../../services/redis.service');
const { telegramUtil, handleError, compareDatesWithOffset } = require('../../utils');
const { getDeleteMessage, getDebugMessage, getCannotDeleteMessage } = require('../../message'); // spamDeleteMessage
const { getMessageReputation } = require('../spam.handlers');

// const slavaWords = ['слава україні', 'слава украине', 'слава зсу'];

class OnTextListener {
  /**
   * @param {Bot} bot
   * @param {Keyv} keyv
   * @param {Date} startTime
   * @param {MessageHandler} messageHandler
   */
  constructor(bot, keyv, startTime, messageHandler) {
    this.bot = bot;
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
        const { deleteRank, tensor } = rep.byRules.dataset;
        const startRank = (await redisService.getTrainingStartRank()) || 0.6;

        if (tensor > startRank && tensor < deleteRank) {
          ctx.api.sendMessage(privateTrainingChat, ctx.state.text).catch(() => {});
        }

        if (ctx.chat.id === creatorId) {
          ctx.reply(JSON.stringify({ ...rep.byRules.dataset, message }, null, 2));
        }
      }

      if (rep.byRules?.rule) {
        try {
          const trainingChatWhitelist = await redisService.getTrainingChatWhitelist();
          const username = ctx.from?.username;
          const fullName = ctx.from?.last_name ? `${ctx.from?.first_name} ${ctx.from?.last_name}` : ctx.from?.first_name;
          const writeUsername = username ? `${username}` : fullName ?? '';
          const userId = ctx.from?.id;

          let debugMessage = '';

          if (env.DEBUG) {
            debugMessage = getDebugMessage({ message, byRules: rep.byRules, startTime: this.startTime });
          }

          if (trainingChatWhitelist && trainingChatWhitelist.includes(String(ctx.chat.id))) {
            ctx.api.sendMessage(privateTrainingChat, ctx.state.text).catch(() => {});
          }

          await ctx
            .deleteMessage()
            .then(() => {
              if (ctx.chatSession.chatSettings.disableDeleteMessage !== true) {
                ctx.replyWithHTML(
                  getDeleteMessage({ writeUsername, userId, wordMessage: '', debugMessage, withLocation: rep.byRules.dataset.location }),
                );
              }
            })
            .catch(() => {
              if (
                !ctx.chatSession.isLimitedDeletion ||
                compareDatesWithOffset(new Date(ctx.chatSession.lastLimitedDeletionDate), new Date(), 1)
              ) {
                ctx.chatSession.isLimitedDeletion = true;
                ctx.chatSession.lastLimitedDeletionDate = new Date();

                telegramUtil.getChatAdmins(this.bot, ctx.chat.id).then(({ adminsString, admins }) => {
                  ctx
                    .replyWithHTML(getCannotDeleteMessage({ adminsString }), { reply_to_message_id: ctx.msg.message_id })
                    .catch(handleError);

                  ctx.state.admins = admins;

                  this.bot.api
                    .sendMessage(
                      logsChat,
                      `Cannot delete the following message from chat\n\n<code>${ctx.chat.title}</code>\n${ctx.msg.text}`,
                      {
                        parse_mode: 'HTML',
                      },
                    )
                    .then(() => {
                      ctx.api
                        .sendDocument(
                          logsChat,
                          new InputFile(Buffer.from(JSON.stringify(ctx, null, 2)), `ctx-${new Date().toISOString()}.json`),
                        )
                        .catch(handleError);
                    })
                    .catch(handleError);
                });
              }
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
