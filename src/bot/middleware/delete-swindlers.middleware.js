const { optimizeText } = require('ukrainian-ml-optimizer');
const stringSimilarity = require('string-similarity');
const { env } = require('typed-dotenv').config();

const { InputFile } = require('grammy');
const { dataset } = require('../../../dataset/dataset');
const { logsChat, swindlersRegex } = require('../../creator');
const { handleError, compareDatesWithOffset, telegramUtil } = require('../../utils');
const { getCannotDeleteMessage } = require('../../message');

const SWINDLER_SETTINGS = {
  DELETE_CHANCE: 0.8,
  LOG_CHANGE: 0.5,
};

const originalDiiaBots = ['@Diia_help_bot'];

class DeleteSwindlersMiddleware {
  /**
   * @param {SwindlersTensorService} swindlersTensorService
   * @param {SwindlersBotsService} swindlersBotsService
   * */
  constructor(swindlersTensorService, swindlersBotsService) {
    this.swindlersTensorService = swindlersTensorService;
    this.swindlersBotsService = swindlersBotsService;
  }

  middleware() {
    /**
     * Delete messages that looks like from swindlers
     *
     * @param {GrammyContext} ctx
     * @param {Next} next
     * */
    const middleware = async (ctx, next) => {
      const message = ctx.state.text;

      const notSwindlers = ['@Diia_help_bot'];
      if (notSwindlers.some((item) => message.includes(item))) {
        return next();
      }

      if (swindlersRegex.test(message)) {
        this.saveSwindlersMessage(ctx, 200, 'site');
        return this.removeMessage(ctx);
      }

      const mentions = this.swindlersBotsService.parseMentions(message);
      if (mentions) {
        // Not a swindler, official dia bot
        if (mentions.includes(originalDiiaBots[0])) {
          return;
        }

        let lastResult = null;
        const foundSwindlerMention = mentions.some((value) => {
          lastResult = this.swindlersBotsService.isSpamBot(value);
          return lastResult.isSpam;
        });

        if (foundSwindlerMention) {
          this.saveSwindlersMessage(ctx, lastResult.rate, `mention (${lastResult.nearestName})`);
          return this.removeMessage(ctx);
        }
      }

      const { isSpam, spamRate } = await this.swindlersTensorService.predict(message);

      if (isSpam) {
        this.saveSwindlersMessage(ctx, spamRate, 'tensor');
        return this.removeMessage(ctx);
      }

      if (spamRate < 0.5) {
        return next();
      }

      const processedMessage = optimizeText(message);

      let lastChance = 0;
      let maxChance = 0;
      const foundSwindler = dataset.swindlers.some((text) => {
        lastChance = stringSimilarity.compareTwoStrings(processedMessage, text);

        if (lastChance > maxChance) {
          maxChance = lastChance;
        }

        return lastChance >= SWINDLER_SETTINGS.DELETE_CHANCE;
      });

      if (maxChance > SWINDLER_SETTINGS.LOG_CHANGE) {
        this.saveSwindlersMessage(ctx, maxChance, 'compare');
      }

      if (env.DEBUG) {
        ctx.reply([foundSwindler, processedMessage, maxChance].join('\n')).catch(handleError);
      }

      if (foundSwindler) {
        return this.removeMessage(ctx);
      }

      next();
    };

    return middleware;
  }

  saveSwindlersMessage(ctx, maxChance, from) {
    return ctx.api.sendMessage(
      logsChat,
      `Looks like swindler's message (${(maxChance * 100).toFixed(2)}%) from ${from}:\n\n<code>${ctx.chat.title}</code>\n${ctx.state.text}`,
      {
        parse_mode: 'HTML',
      },
    );
  }

  /**
   * Delete messages that looks like from swindlers
   *
   * @param {GrammyContext} ctx
   * */
  removeMessage(ctx) {
    return ctx.deleteMessage().catch(() => {
      if (!ctx.chatSession.isLimitedDeletion || compareDatesWithOffset(new Date(ctx.chatSession.lastLimitedDeletionDate), new Date(), 1)) {
        ctx.chatSession.isLimitedDeletion = true;
        ctx.chatSession.lastLimitedDeletionDate = new Date();

        telegramUtil.getChatAdmins(ctx, ctx.chat.id).then(({ adminsString, admins }) => {
          ctx.replyWithHTML(getCannotDeleteMessage({ adminsString }), { reply_to_message_id: ctx.msg.message_id }).catch(handleError);

          ctx.state.admins = admins;

          ctx.api
            .sendMessage(logsChat, `Cannot delete the following message from chat\n\n<code>${ctx.chat.title}</code>\n${ctx.msg.text}`, {
              parse_mode: 'HTML',
            })
            .then(() => {
              ctx.api
                .sendDocument(logsChat, new InputFile(Buffer.from(JSON.stringify(ctx, null, 2)), `ctx-${new Date().toISOString()}.json`))
                .catch(handleError);
            })
            .catch(handleError);
        });
      }
    });
  }
}

module.exports = {
  DeleteSwindlersMiddleware,
};
