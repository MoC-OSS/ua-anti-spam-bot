import { InputFile } from 'grammy';

import { logsChat } from '../../creator';
import { getCannotDeleteMessage, swindlersWarningMessage } from '../../message';
import type { SwindlersDetectService } from '../../services/swindlers-detect.service';
import { compareDatesWithOffset, getUserData, handleError, revealHiddenUrls, telegramUtil } from '../../utils';

const SWINDLER_SETTINGS = {
  WARNING_DELAY: 86_400_000 * 3,
};

class DeleteSwindlersMiddleware {
  /**
   * @param {SwindlersDetectService} swindlersDetectService
   * */
  swindlersDetectService: SwindlersDetectService;

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
    const middleware = async (context, next) => {
      const message = revealHiddenUrls(context);

      const result = await this.swindlersDetectService.isSwindlerMessage(message);

      context.state.swindlersResult = result;

      if (result.isSpam) {
        await this.saveSwindlersMessage(context, result.rate, result.displayReason || result.reason, message);
        await this.processWarningMessage(context);
        this.removeMessage(context);
        return;
      }

      if (!result.isSpam && result.reason === 'compare') {
        await this.saveSwindlersMessage(context, result.rate, result.displayReason || result.reason, message);
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
  async saveSwindlersMessage(context, maxChance, from, message) {
    const { writeUsername, userId } = getUserData(context);
    const chatInfo = await context.getChat();
    const text = message || context.state.text;

    const chatMention =
      context.chat.title &&
      (chatInfo.invite_link ? `<a href="${chatInfo.invite_link}">${context.chat.title}</a>` : `<code>${context.chat.title}</code>`);

    const userMention = `<a href="tg://user?id=${userId}">${writeUsername}</a>`;

    if (!chatInfo.invite_link) {
      await context.api.sendDocument(
        logsChat,
        new InputFile(Buffer.from(JSON.stringify(chatInfo, null, 2)), `chat-info-${context.chat.title}-${new Date().toISOString()}.csv`),
      );
    }

    return context.api.sendMessage(
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
  processWarningMessage(context) {
    const shouldSend =
      !context.chatSession.lastWarningDate ||
      (context.chatSession.lastWarningDate &&
        Date.now() > new Date(context.chatSession.lastWarningDate).getTime() + SWINDLER_SETTINGS.WARNING_DELAY);
    if (shouldSend) {
      context.chatSession.lastWarningDate = new Date();
      return context.reply(swindlersWarningMessage, {
        parse_mode: 'HTML',
      });
    }
  }

  /**
   * Delete messages that looks like from swindlers
   *
   * @param {GrammyContext} ctx
   * */
  removeMessage(context) {
    return context.deleteMessage().catch(() => {
      if (
        !context.chatSession.isLimitedDeletion ||
        compareDatesWithOffset(new Date(context.chatSession.lastLimitedDeletionDate), new Date(), 1)
      ) {
        context.chatSession.isLimitedDeletion = true;
        context.chatSession.lastLimitedDeletionDate = new Date();

        return telegramUtil
          .getChatAdmins(context, context.chat.id)
          .then(({ adminsString, admins }) => {
            context
              .replyWithHTML(getCannotDeleteMessage({ adminsString }), { reply_to_message_id: context.msg.message_id })
              .catch(handleError);

            context.state.admins = admins;

            context.api
              .sendMessage(
                logsChat,
                `Cannot delete the following message from chat\n\n<code>${context.chat.title}</code>\n${context.msg.text}`,
                {
                  parse_mode: 'HTML',
                },
              )
              .then(() => {
                context.api
                  .sendDocument(
                    logsChat,
                    new InputFile(Buffer.from(JSON.stringify(context, null, 2)), `ctx-${new Date().toISOString()}.json`),
                  )
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
