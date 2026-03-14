import { Menu } from '@grammyjs/menu';

import Bottleneck from 'bottleneck';

import { cancelMessageSending, confirmationMessage, getSuccessfulMessage, getUpdateMessage, getUpdatesMessage } from '@message';

import { redisService } from '@services/redis.service';

import type { GrammyContext, GrammyMenuContext } from '@app-types/context';
import type { ChatSession } from '@app-types/session';

import { handleError } from '@utils/error-handler';

export class UpdatesCommand {
  private menu: Menu<GrammyMenuContext> | undefined;

  public async middleware(context: GrammyContext) {
    const userInput = context.msg?.text;
    const textEntities = context.msg?.entities;

    context.session.updatesText = userInput;
    context.session.textEntities = textEntities ?? undefined;
    context.session.step = 'messageSending';
    await context.replyWithChatAction('typing');
    const rawSessions = await redisService.getChatSessions();

    const sessions = rawSessions.filter(
      (session) => (session.payload.chatType === 'private' || session.payload.chatType === 'supergroup') && !session.payload.botRemoved,
    );

    await context.reply(`${confirmationMessage}\nВсього чатів: ${sessions.length}`);
    await context.reply(userInput || '', { entities: textEntities ?? undefined, reply_markup: this.menu });
  }

  initMenu() {
    this.menu = new Menu<GrammyMenuContext>('approveUpdatesMenu')
      .text({ text: 'Підтвердити ✅', payload: 'approve' })
      .row()
      .text({ text: 'Відмінити ⛔️', payload: 'cancel' });

    return this.menu;
  }

  initialization() {
    /**
     * @param {GrammyContext} context
     * */
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context: GrammyContext) => {
      context.session.step = 'confirmation';
      await context.reply(getUpdatesMessage(), { parse_mode: 'HTML' });
    };
  }

  confirmation() {
    /**
     * @param {GrammyContext} context
     * */

    return this.middleware.bind(this);
  }

  messageSending() {
    /**
     * @param {GrammyContext} context
     * */
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context: GrammyContext) => {
      context.session.step = 'idle';
      const payload = context.match;

      if (payload === 'approve') {
        const sessions = await redisService.getChatSessions();
        const superGroupSessions = sessions.filter((session) => session.payload.chatType === 'supergroup' && !session.payload.botRemoved);
        const privateGroupSessions = sessions.filter((session) => session.payload.chatType === 'private' && !session.payload.botRemoved);

        await this.bulkSending(context, superGroupSessions, 'supergroup');
        await this.bulkSending(context, privateGroupSessions, 'private');
      } else {
        await context.reply(cancelMessageSending);
      }
    };
  }

  /**
   * @param {GrammyContext} context
   * @param {ChatSession[]} sessions
   * @param {string} type
   *
   * @returns {Promise<void>}
   * */
  bulkSending(context: GrammyContext, sessions: ChatSession[], type: string) {
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

      sessions.forEach((chartSession) => {
        limiter
          .schedule(() =>
            context.api
              .sendMessage(chartSession.id, updatesMessage || '', { entities: updatesMessageEntities ?? undefined })
              // eslint-disable-next-line sonarjs/no-nested-functions
              .then(() => {
                successCount += 1;
              })
              .catch(handleError)
              // eslint-disable-next-line sonarjs/no-nested-functions
              .finally(() => {
                finishedCount += 1;
              }),
          )
          .catch(handleError);
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
