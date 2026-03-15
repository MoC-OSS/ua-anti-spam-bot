import type { Bot } from 'grammy';
import { InputFile } from 'grammy';

import axios from 'axios';
import escapeHTML from 'escape-html';

import { logsChat, secondLogsChat } from '@bot/creator';

import { LOGS_CHAT_THREAD_IDS, SECOND_LOGS_CHAT_THREAD_IDS } from '@const/logs.const';

import { cannotDeleteMessage, getCannotDeleteMessage, swindlerLogsStartMessage } from '@message';
import { getSwindlersWarningMessage } from '@message/swindlers.message';

import type { SwindlersDetectService } from '@services/swindlers-detect.service';

import { environmentConfig } from '@shared/config';

import type { GrammyContext, GrammyMiddleware } from '@app-types/context';
import type { SwindlerResponseBody } from '@app-types/express';
import type { LooseAutocomplete } from '@app-types/generic';
import type { SwindlersResult, SwindlerType } from '@app-types/swindlers';

import { compareDatesWithOffset } from '@utils/date-format.util';
import { handleError } from '@utils/error-handler.util';
import { revealHiddenUrls } from '@utils/reveal-hidden-urls.util';
import { telegramUtility } from '@utils/util-instances.util';

const host = `http://${environmentConfig.HOST}:${environmentConfig.PORT}`;

const SWINDLER_SETTINGS = {
  WARNING_DELAY: 86_400_000 * 3,
};

/**
 * Detects and removes scam/swindler messages from chats.
 * Logs matched messages, sends warning notifications, and deletes the offending content.
 */
export class DeleteSwindlersMiddleware {
  constructor(
    private bot: Bot<GrammyContext>,
    private swindlersDetectService: SwindlersDetectService,
  ) {}

  middleware(): GrammyMiddleware {
    /**
     * Delete messages that looks like from swindlers
     * */
    // eslint-disable-next-line unicorn/consistent-function-scoping
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

  /** Checks a message against the swindlers detection service, falling back to local detection if the server is unavailable. */
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
   * Logs the detected swindler message to the main and secondary logs chats.
   * @param {GrammyContext} context
   * @param {number} maxChance
   * @param {SwindlerType | string} from
   * @param {string} [message]
   * */
  async saveSwindlersMessage(context: GrammyContext, maxChance: number, from: LooseAutocomplete<SwindlerType>, message?: string) {
    const { userMention, chatMention } = await telegramUtility.getLogsSaveMessageParts(context);
    const text = message || context.state?.text || '';

    await context.api.sendMessage(
      logsChat,
      `${swindlerLogsStartMessage} (${(maxChance * 100).toFixed(2)}%) from <code>${from as string}</code> by user ${userMention}:\n\n${
        chatMention || userMention
      }\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.SWINDLERS,
      },
    );

    return context.api.sendMessage(
      secondLogsChat,
      `${swindlerLogsStartMessage} (${(maxChance * 100).toFixed(2)}%) from <code>${from as string}</code> by user ${userMention}:\n\n${
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

      return context.reply(getSwindlersWarningMessage(context), {
        parse_mode: 'HTML',
      });
    }

    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  }

  /** Attempts to delete the swindler message. Notifies admins if deletion fails due to missing permissions. */
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
          // eslint-disable-next-line unicorn/no-useless-undefined
          return undefined;
        }

        return telegramUtility
          .getChatAdmins(context, context.chat.id)
          .then(({ adminsString }) => {
            context
              .reply(getCannotDeleteMessage(context, { adminsString }), {
                parse_mode: 'HTML',
                reply_to_message_id: context.msg?.message_id,
              })
              .catch(handleError);

            context.api
              .sendMessage(
                logsChat,
                `${cannotDeleteMessage}\n\n<code>${telegramUtility.getChatTitle(context.chat)}</code>\n${escapeHTML(context.msg?.text || '')}`,
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

      // eslint-disable-next-line unicorn/no-useless-undefined
      return undefined;
    }
  }
}
