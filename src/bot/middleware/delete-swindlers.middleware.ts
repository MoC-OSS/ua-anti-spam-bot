import axios from 'axios';
import escapeHTML from 'escape-html';
import type { Bot } from 'grammy';
import { InputFile } from 'grammy';
import type { GrammyContext, GrammyMiddleware, SwindlerResponseBody, SwindlersResult, SwindlerType } from 'types';

import { environmentConfig } from '../../config';
import { LOGS_CHAT_THREAD_IDS, SECOND_LOGS_CHAT_THREAD_IDS } from '../../const';
import { logsChat, secondLogsChat } from '../../creator';
import { cannotDeleteMessage, getCannotDeleteMessage, swindlerLogsStartMessage, swindlersWarningMessage } from '../../message';
import type { SwindlersDetectService } from '../../services';
import { compareDatesWithOffset, handleError, revealHiddenUrls, telegramUtil } from '../../utils';

const host = `http://${environmentConfig.HOST}:${environmentConfig.PORT}`;

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

      const result = await this.checkMessage(message);

      context.state.swindlersResult = result;

      if (result.isSpam) {
        await this.saveSwindlersMessage(context, result.rate, result.displayReason || result.reason, message);
        await this.processWarningMessage(context);
        await this.removeMessage(context);
        return next();
      }

      if (!result.isSpam && result.reason === 'compare') {
        await this.saveSwindlersMessage(context, result.rate, result.displayReason || result.reason, message);
      }

      return next();
    };
  }

  async checkMessage(message: string): Promise<SwindlersResult> {
    try {
      if (environmentConfig.USE_SERVER) {
        return await axios.post<SwindlerResponseBody>(`${host}/swindlers`, { message }).then((response) => response.data.result);
      }

      return this.swindlersDetectService.isSwindlerMessage(message);
    } catch (error) {
      handleError(error, 'API_DOWN');
      return this.swindlersDetectService.isSwindlerMessage(message);
    }
  }

  /**
   * @param {GrammyContext} context
   * @param {number} maxChance
   * @param {SwindlerType | string} from
   * @param {string} [message]
   * */
  async saveSwindlersMessage(context: GrammyContext, maxChance: number, from: SwindlerType | string, message?: string) {
    const { userMention, chatMention } = await telegramUtil.getLogsSaveMessageParts(context);
    const text = message || context.state?.text || '';

    await context.api.sendMessage(
      logsChat,
      `${swindlerLogsStartMessage} (${(maxChance * 100).toFixed(2)}%) from <code>${from}</code> by user ${userMention}:\n\n${
        chatMention || userMention
      }\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.SWINDLERS,
      },
    );

    return context.api.sendMessage(
      secondLogsChat,
      `${swindlerLogsStartMessage} (${(maxChance * 100).toFixed(2)}%) from <code>${from}</code> by user ${userMention}:\n\n${
        chatMention || userMention
      }\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: SECOND_LOGS_CHAT_THREAD_IDS.SWINDLERS,
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
          .getChatAdmins(context, context.chat.id)
          .then(({ adminsString }) => {
            context
              .replyWithHTML(getCannotDeleteMessage({ adminsString }), { reply_to_message_id: context.msg?.message_id })
              .catch(handleError);

            context.api
              .sendMessage(
                logsChat,
                `${cannotDeleteMessage}\n\n<code>${telegramUtil.getChatTitle(context.chat)}</code>\n${escapeHTML(context.msg?.text || '')}`,
                {
                  parse_mode: 'HTML',
                  message_thread_id: LOGS_CHAT_THREAD_IDS.SWINDLERS,
                },
              )
              .then(() => {
                context.api
                  .sendDocument(
                    logsChat,
                    new InputFile(Buffer.from(JSON.stringify(context, null, 2)), `ctx-${new Date().toISOString()}.json`),
                    {
                      message_thread_id: LOGS_CHAT_THREAD_IDS.SWINDLERS,
                    },
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
