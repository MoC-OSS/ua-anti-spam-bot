import { Menu } from '@grammyjs/menu';
import Bottleneck from 'bottleneck';

import { cancelMessageSending, confirmationMessage, getSuccessfulMessage, getUpdateMessage, getUpdatesMessage } from '../../message';
import { redisService } from '../../services/redis.service';
import type { GrammyContext } from '../../types';
import { handleError } from '../../utils';

export class UpdatesMiddleware {
  menu: any;

  constructor() {
    this.menu = null;
  }

  initMenu() {
    this.menu = new Menu('approveUpdatesMenu')
      .text({ text: 'Підтвердити ✅', payload: 'approve' })
      .row()
      .text({ text: 'Відмінити ⛔️', payload: 'cancel' });

    return this.menu;
  }

  initialization() {
    /**
     * @param {GrammyContext} ctx
     * */
    return (context: GrammyContext) => {
      context.session.step = 'confirmation';
      context.replyWithHTML(getUpdatesMessage());
    };
  }

  confirmation() {
    /**
     * @param {GrammyContext} ctx
     * */
    const middleware = async (context) => {
      const userInput = context.msg?.text;
      const textEntities = context.msg?.entities;
      context.session.updatesText = userInput;
      context.session.textEntities = textEntities ?? null;
      context.session.step = 'messageSending';
      await context.replyWithChatAction('typing');
      const sessions = (await redisService.getChatSessions()).filter(
        (session) => (session.data.chatType === 'private' || session.data.chatType === 'supergroup') && !session.data.botRemoved,
      );

      await context.reply(`${confirmationMessage}\nВсього чатів: ${sessions.length}`);
      await context.reply(userInput, { entities: textEntities ?? null, reply_markup: this.menu });
    };

    return middleware;
  }

  messageSending() {
    /**
     * @param {GrammyContext} ctx
     * */
    return async (context) => {
      context.session.step = 'idle';
      const payload = context.match;
      if (payload === 'approve') {
        const sessions = await redisService.getChatSessions();
        const superGroupSessions = sessions.filter((session) => session.data.chatType === 'supergroup' && !session.data.botRemoved);
        const privateGroupSessions = sessions.filter((session) => session.data.chatType === 'private' && !session.data.botRemoved);

        await this.bulkSending(context, superGroupSessions, 'supergroup');
        await this.bulkSending(context, privateGroupSessions, 'private');
      } else {
        await context.reply(cancelMessageSending);
      }
    };
  }

  /**
   * @param {GrammyContext} ctx
   * @param {ChatSession[]} sessions
   * @param {string} type
   *
   * @returns {Promise<void>}
   * */
  bulkSending(context, sessions, type) {
    return new Promise<void>((resolve) => {
      const limiter = new Bottleneck({
        maxConcurrent: 1,
        minTime: 2000,
      });

      const updatesMessage = context.session.updatesText;
      const updatesMessageEntities = context.session.textEntities;

      const totalCount = sessions.length;
      const chunkSize = Math.ceil(totalCount / 10);
      let finishedCount = 0;
      let successCount = 0;

      sessions.forEach((e) => {
        limiter.schedule(() => {
          context.api
            .sendMessage(e.id, updatesMessage, { entities: updatesMessageEntities ?? null })
            .then(() => {
              successCount += 1;
            })
            .catch(handleError)
            .finally(() => {
              finishedCount += 1;
            });
        });
      });

      limiter.on('done', () => {
        if (finishedCount % chunkSize === 0) {
          context.reply(getUpdateMessage({ totalCount, successCount, finishedCount, type })).catch(handleError);
        }
      });

      limiter.on('empty', () => {
        context.reply(getSuccessfulMessage({ totalCount, successCount })).catch(handleError);
        resolve();
      });
    });
  }
}

module.exports = {
  UpdatesMiddleware,
};
