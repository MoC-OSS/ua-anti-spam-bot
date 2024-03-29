import escapeHTML from 'escape-html';
import type { Bot, NextFunction } from 'grammy';
import { InputFile } from 'grammy';

import { environmentConfig } from '../../config';
import { LOGS_CHAT_THREAD_IDS } from '../../const';
import { logsChat, privateTrainingChat } from '../../creator';
import { cannotDeleteMessage, getCannotDeleteMessage, getDebugMessage, getDeleteMessage } from '../../message'; // spamDeleteMessage
import { redisService } from '../../services';
import type { GrammyContext, GrammyMiddleware } from '../../types';
import { compareDatesWithOffset, getUserData, handleError, telegramUtil } from '../../utils';
import type { MessageHandler } from '../message.handler';
import { isFilteredByRules } from '../spam.handlers';

// const slavaWords = ['слава україні', 'слава украине', 'слава зсу'];

export class OnTextListener {
  /**
   * @param {Bot} bot
   * @param {Date} startTime
   * @param {MessageHandler} messageHandler
   */

  constructor(private bot: Bot<GrammyContext>, private startTime: Date, private messageHandler: MessageHandler) {}

  /**
   * Handles every received message
   * */
  middleware(): GrammyMiddleware {
    /**
     * @param {GrammyContext} context
     * @param {NextFunction} next
     * */
    return async (context: GrammyContext, next: NextFunction) => {
      // TODO use for ctx prod debug
      // console.info('enter onText ******', ctx.chat?.title, '******', ctx.state.text);

      const message = context.state.text;
      /**
       * Removed because ask to reduce chat messages
       * */
      // if (slavaWords.some((word) => message.toLowerCase().includes(word.toLowerCase()))) {
      //   ctx.reply('Героям Слава! 🇺🇦', { reply_to_message_id: ctx?.update?.message?.message_id });
      // }

      if (!context.chat?.id) {
        console.error(Date.toString(), 'Cannot access the chat:', context.chat);
        return next();
      }

      if (context.session?.isCurrentUserAdmin && !environmentConfig.DEBUG) {
        return next();
      }

      const rep = await isFilteredByRules(context, this.messageHandler);

      if (rep.dataset) {
        // TODO define the same types
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
                  getDeleteMessage({
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
                  return;
                }

                return telegramUtil
                  .getChatAdmins(context, context.chat.id)
                  .then(({ adminsString }) => {
                    context
                      .replyWithHTML(getCannotDeleteMessage({ adminsString }), { reply_to_message_id: context.msg?.message_id })
                      .catch(handleError);

                    this.bot.api
                      .sendMessage(
                        logsChat,
                        `${cannotDeleteMessage}\n\n<code>${telegramUtil.getChatTitle(context.chat)}</code>\n${escapeHTML(
                          context.msg?.text || '',
                        )}`,
                        {
                          parse_mode: 'HTML',
                          message_thread_id: LOGS_CHAT_THREAD_IDS.STRATEGIC,
                        },
                      )
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
            });
        } catch (error) {
          console.error('Cannot delete the message. Reason:', error);
        }
      }

      return next();
    };
  }
}
