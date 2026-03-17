import type { Bot, NextFunction } from 'grammy';
import { InputFile } from 'grammy';

import escapeHTML from 'escape-html';

import { logsChat, privateTrainingChat } from '@bot/creator';
import type { MessageHandler } from '@bot/handlers/message.handler';
import { isFilteredByRules } from '@bot/handlers/spam.handler';

import { LOGS_CHAT_THREAD_IDS } from '@const/logs.const';

import { cannotDeleteMessage, getCannotDeleteMessage, getDebugMessage, getDeleteMessage } from '@message'; // spamDeleteMessage

import { redisService } from '@services/redis.service';

import { environmentConfig } from '@shared/config';

import type { GrammyContext, GrammyMiddleware } from '@app-types/context';

import { compareDatesWithOffset } from '@utils/date-format.util';
import { handleError } from '@utils/error-handler.util';
import { getUserData } from '@utils/generic.util';
import { logger } from '@utils/logger.util';
import { telegramUtility } from '@utils/util-instances.util';

/**
 * Listener that processes incoming text messages, detects spam via tensor rules,
 * deletes offending messages, and sends notifications to the chat and logs.
 */
export class OnTextListener {
  /**
   * Initializes the listener with bot instance, start time, and message handler.
   * @param bot - The Grammy bot instance.
   * @param startTime - The timestamp when the bot was started.
   * @param messageHandler - The handler responsible for processing messages.
   */
  constructor(
    private bot: Bot<GrammyContext>,
    private startTime: Date,
    private messageHandler: MessageHandler,
  ) {}

  /**
   * Handles every received message.
   * @returns The Grammy middleware function.
   */
  middleware(): GrammyMiddleware {
    /**
     * Processes a text message through spam detection rules.
     * @param context - The Grammy context object.
     * @param next - The next middleware function in the chain.
     * @returns A promise that resolves when the middleware chain completes.
     */
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context: GrammyContext, next: NextFunction) => {
      // NOTE use for ctx prod debug
      // logger.info('enter onText ******', ctx.chat?.title, '******', ctx.state.text);

      const message = context.state.text;
      /**
       * Removed because ask to reduce chat messages
       */
      // if (slavaWords.some((word) => message.toLowerCase().includes(word.toLowerCase()))) {
      //   ctx.reply('Героям Слава! 🇺🇦', { reply_to_message_id: ctx?.update?.message?.message_id });
      // }

      if (!context.chat?.id) {
        logger.error({ chat: context.chat, date: Date.toString() }, 'Cannot access the chat:');

        return next();
      }

      if (context.session?.isCurrentUserAdmin && !environmentConfig.DEBUG) {
        return next();
      }

      const rep = await isFilteredByRules(context, this.messageHandler);

      if (rep.dataset) {
        // NOTE define the same types

        // @ts-ignore
        context.state.dataset = rep.dataset;
        const { deleteRank, tensor } = rep.dataset;
        const startRank = (await redisService.getTrainingStartRank()) || 0.6;

        if (tensor && tensor > startRank && tensor < deleteRank) {
          context.api.sendMessage(privateTrainingChat, context.state.text || '').catch(handleError);
        }
      }

      if (rep?.rule) {
        try {
          const trainingChatWhitelist = await redisService.getTrainingChatWhitelist();
          const { writeUsername, userId } = getUserData(context);

          let debugMessage = '';

          if (environmentConfig.DEBUG) {
            debugMessage = getDebugMessage({ message, byRules: rep, startTime: this.startTime });
          }

          if (trainingChatWhitelist && Array.isArray(trainingChatWhitelist) && trainingChatWhitelist.includes(String(context.chat.id))) {
            context.api.sendMessage(privateTrainingChat, context.state.text || '').catch(() => handleError);
          }

          await context
            .deleteMessage()
            .then(async () => {
              if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
                await context.replyWithSelfDestructedHTML(
                  getDeleteMessage(context, {
                    writeUsername,
                    userId,
                    wordMessage: '',
                    debugMessage,
                    withLocation: rep.dataset.location,
                  }),
                );
              }
            })
            .catch(() => {
              if (
                !context.chatSession.isLimitedDeletion ||
                compareDatesWithOffset(new Date(context.chatSession.lastLimitedDeletionDate || 0), new Date(), 1)
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

                    this.bot.api
                      .sendMessage(
                        logsChat,
                        `${cannotDeleteMessage}\n\n<code>${telegramUtility.getChatTitle(context.chat)}</code>\n${escapeHTML(
                          context.msg?.text || '',
                        )}`,
                        {
                          parse_mode: 'HTML',
                          message_thread_id: LOGS_CHAT_THREAD_IDS.STRATEGIC,
                        },
                      )
                      // eslint-disable-next-line sonarjs/no-nested-functions
                      .then(() => {
                        context.api
                          .sendDocument(
                            logsChat,
                            new InputFile(Buffer.from(JSON.stringify(context, null, 2)), `ctx-${new Date().toISOString()}.json`),
                            {
                              message_thread_id: LOGS_CHAT_THREAD_IDS.STRATEGIC,
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
            });
        } catch (error) {
          logger.error({ err: error }, 'Cannot delete the message.');
        }
      }

      return next();
    };
  }
}
