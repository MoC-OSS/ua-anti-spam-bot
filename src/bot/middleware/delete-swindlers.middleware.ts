import { InputFile } from 'grammy';
import { SwindlersDetectService } from '../../services/swindlers-detect.service';
import { logsChat } from '../../creator';
import { handleError, compareDatesWithOffset, telegramUtil, getUserData, revealHiddenUrls } from '../../utils';
import { getCannotDeleteMessage, swindlersWarningMessage } from '../../message';

const SWINDLER_SETTINGS = {
  WARNING_DELAY: 86400000 * 3,
};

class DeleteSwindlersMiddleware {
  /**
   * @param {SwindlersDetectService} swindlersDetectService
   * */
  swindlersDetectService: SwindlersDetectService
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
      const message = revealHiddenUrls(ctx);

      const result = await this.swindlersDetectService.isSwindlerMessage(message);

      ctx.state.swindlersResult = result;

      if (result.isSpam) {
        await this.saveSwindlersMessage(ctx, result.rate, result.displayReason || result.reason, message);
        await this.processWarningMessage(ctx);
        this.removeMessage(ctx);
        return;
      }

      if (!result.isSpam && result.reason === 'compare') {
        await this.saveSwindlersMessage(ctx, result.rate, result.displayReason || result.reason, message);
      }

      return next();
    };
    return middleware;
  }

  /**
   * @param {GrammyContext} ctx
   * @param {number} maxChance
   * @param {SwindlerType | string} from
   * @param {string} [message]
   * */
  async saveSwindlersMessage(ctx, maxChance, from, message) {
    const { writeUsername, userId } = getUserData(ctx);
    const chatInfo = await ctx.getChat();
    const text = message || ctx.state.text;

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
      }\n${text}`,
      {
        parse_mode: 'HTML',
      },
    );
  }

  /**
   * Sends warning to the chat, or skips if it was sent
   *
   * @param {GrammyContext} ctx
   * */
  processWarningMessage(ctx) {
    const shouldSend =
      !ctx.chatSession.lastWarningDate ||
      (ctx.chatSession.lastWarningDate &&
        Date.now() > new Date(ctx.chatSession.lastWarningDate).getTime() + SWINDLER_SETTINGS.WARNING_DELAY);
    if (shouldSend) {
      ctx.chatSession.lastWarningDate = new Date();
      return ctx.reply(swindlersWarningMessage, {
        parse_mode: 'HTML',
      });
    }
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
