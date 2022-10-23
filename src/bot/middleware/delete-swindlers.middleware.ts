import type { Bot } from 'grammy';
import { InputFile } from 'grammy';
import type { GrammyContext, GrammyMiddleware, SwindlerType } from 'types';

import { logsChat } from '../../creator';
import { getCannotDeleteMessage, swindlersWarningMessage } from '../../message';
import type { SwindlersDetectService } from '../../services';
import { compareDatesWithOffset, getUserData, handleError, revealHiddenUrls, telegramUtil } from '../../utils';

const SWINDLER_SETTINGS = {
  WARNING_DELAY: 86_400_000 * 3,
};

export class DeleteSwindlersMiddleware {
  constructor(private bot: Bot<GrammyContext>, private swindlersDetectService: SwindlersDetectService) {}

  middleware(): GrammyMiddleware {
    /**
     * Delete messages that looks like from swindlers
     * */
    return async (context, next) => {
      const message = revealHiddenUrls(context);

      const result = await this.swindlersDetectService.isSwindlerMessage(message);

      context.state.swindlersResult = result;

      if (result.isSpam) {
        await this.saveSwindlersMessage(context, result.rate, result.displayReason || result.reason, message);
        await this.processWarningMessage(context);
        await this.removeMessage(context);
        return;
      }

      if (!result.isSpam && result.reason === 'compare') {
        await this.saveSwindlersMessage(context, result.rate, result.displayReason || result.reason, message);
      }

      return next();
    };
  }

  /**
   * @param {GrammyContext} context
   * @param {number} maxChance
   * @param {SwindlerType | string} from
   * @param {string} [message]
   * */
  async saveSwindlersMessage(context: GrammyContext, maxChance: number, from: SwindlerType | string, message?: string) {
    const { writeUsername, userId } = getUserData(context);
    const chatInfo = await context.getChat();
    const text = message || context.state?.text || '';

    const chatTitle = telegramUtil.getChatTitle(context.chat);
    const inviteLink = telegramUtil.getInviteLink(chatInfo);

    const chatMention = chatTitle && (inviteLink ? `<a href="${inviteLink}">${chatTitle}</a>` : `<code>${chatTitle}</code>`);

    const userMention = userId ? `<a href="tg://user?id=${userId}">${writeUsername}</a>` : writeUsername;

    if (!inviteLink) {
      await context.api.sendDocument(
        logsChat,
        new InputFile(Buffer.from(JSON.stringify(chatInfo, null, 2)), `chat-info-${chatTitle}-${new Date().toISOString()}.csv`),
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
   * */
  processWarningMessage(context: GrammyContext) {
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
   * */
  async removeMessage(context: GrammyContext) {
    try {
      return await context.deleteMessage();
    } catch {
      if (
        !context.chatSession.isLimitedDeletion ||
        compareDatesWithOffset(new Date(context.chatSession.lastLimitedDeletionDate || ''), new Date(), 1)
      ) {
        context.chatSession.isLimitedDeletion = true;
        context.chatSession.lastLimitedDeletionDate = new Date();

        if (!context.chat?.id) {
          return;
        }

        return telegramUtil
          .getChatAdmins(this.bot, context.chat.id)
          .then(({ adminsString }) => {
            context
              .replyWithHTML(getCannotDeleteMessage({ adminsString }), { reply_to_message_id: context.msg?.message_id })
              .catch(handleError);

            context.api
              .sendMessage(
                logsChat,
                `Cannot delete the following message from chat\n\n<code>${telegramUtil.getChatTitle(context.chat)}</code>\n${
                  context.msg?.text || ''
                }`,
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
    }
  }
}
