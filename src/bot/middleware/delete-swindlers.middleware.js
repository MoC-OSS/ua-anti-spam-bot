const { optimizeText } = require('ukrainian-ml-optimizer');
const stringSimilarity = require('string-similarity');
const { env } = require('typed-dotenv').config();

const { InputFile } = require('grammy');
const { dataset } = require('../../../dataset/dataset');
const { logsChat } = require('../../creator');
const { handleError, compareDatesWithOffset, telegramUtil } = require('../../utils');
const { getCannotDeleteMessage } = require('../../message');

const SWINDLER_SETTINGS = {
  DELETE_CHANCE: 0.8,
  LOG_CHANGE: 0.5,
};

/**
 * Delete messages that looks like from swindlers
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
function deleteSwindlersMiddleware(ctx, next) {
  const processedMessage = optimizeText(ctx.state.text);

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
    ctx.api.sendMessage(
      logsChat,
      `Looks like swindler's message (${(maxChance * 100).toFixed(2)}%):\n\n<code>${ctx.chat.title}</code>\n${ctx.state.text}`,
      {
        parse_mode: 'HTML',
      },
    );
  }

  if (env.DEBUG) {
    ctx.reply([foundSwindler, processedMessage, maxChance].join('\n')).catch(handleError);
  }

  if (foundSwindler) {
    ctx.deleteMessage().catch(() => {
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
  } else {
    next();
  }
}

module.exports = {
  deleteSwindlersMiddleware,
};
