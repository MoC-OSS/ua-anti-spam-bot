const { InputFile } = require('grammy');
const { logsChat } = require('../../creator');
const { handleError, compareDatesWithOffset, telegramUtil, getUserData } = require('../../utils');
const { getCannotDeleteMessage } = require('../../message');

class DeleteSwindlersMiddleware {
  /**
   * @param {SwindlersDetectService} swindlersDetectService
   * */
  constructor(swindlersDetectService) {
    this.swindlersDetectService = swindlersDetectService;
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

      const result = await this.swindlersDetectService.isSwindlerMessage(message);

      ctx.state.swindlersResult = result;

      if (result.isSpam) {
        this.saveSwindlersMessage(ctx, result.rate, result.displayReason || result.reason);
        this.removeMessage(ctx);
        return;
      }

      if (!result.isSpam && result.reason === 'compare') {
        this.saveSwindlersMessage(ctx, result.rate, result.displayReason || result.reason);
      }

      return next();
    };

    return middleware;
  }

  /**
   * @param {GrammyContext} ctx
   * @param {number} maxChance
   * @param {SwindlerType | string} from
   * */
  async saveSwindlersMessage(ctx, maxChance, from) {
    const { writeUsername, userId } = getUserData(ctx);
    const chatInfo = await ctx.getChat();

    const chatMention =
      ctx.chat.title &&
      (chatInfo.invite_link ? `<a href="${chatInfo.invite_link}">${ctx.chat.title}</a>` : `<code>${ctx.chat.title}</code>`);

    const userMention = `<a href="tg://user?id=${userId}">${writeUsername}</a>`;

    if (!chatInfo.invite_link) {
      await ctx.api.sendDocument(
        logsChat,
        new InputFile(Buffer.from(JSON.stringify(chatInfo, null, 2)), `chat-info-${ctx.chat.title}-${new Date().toISOString()}.csv`),
      );
    }

    return ctx.api.sendMessage(
      logsChat,
      `Looks like swindler's message (${(maxChance * 100).toFixed(2)}%) from <code>${from}</code> by user ${userMention}:\n\n${
        chatMention || userMention
      }\n${ctx.state.text}`,
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

        return telegramUtil
          .getChatAdmins(ctx, ctx.chat.id)
          .then(({ adminsString, admins }) => {
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
          })
          .catch(handleError);
      }
    });
  }
}

module.exports = {
  DeleteSwindlersMiddleware,
};
