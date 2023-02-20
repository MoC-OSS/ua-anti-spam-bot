import { Menu } from '@grammyjs/menu';

import { cancelMessageSending, confirmationMessage, getSuccessfulMessage, getUpdateMessage, getUpdatesMessage } from '../../../message';
import { redisService } from '../../../services';
import { queueService } from '../../../services/queue.service';
import type { ChatSession, GrammyContext, GrammyMenuContext } from '../../../types';

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
      (session) => (session.data.chatType === 'private' || session.data.chatType === 'supergroup') && !session.data.botRemoved,
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
    return async (context: GrammyContext) => {
      context.session.step = 'confirmation';
      await context.replyWithHTML(getUpdatesMessage());
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
    return async (context: GrammyContext) => {
      context.session.step = 'idle';
      const payload = context.match;
      if (payload === 'approve') {
        const sessions = await redisService.getChatSessions();
        const superGroupSessions = sessions.filter((session) => session.data.chatType === 'supergroup' && !session.data.botRemoved);
        const groupSessions = sessions.filter((session) => session.data.chatType === 'group' && !session.data.botRemoved);
        const privateSessions = sessions.filter((session) => session.data.chatType === 'private' && !session.data.botRemoved);

        this.bulkSending(context, superGroupSessions, 'supergroup');
        this.bulkSending(context, groupSessions, 'group');
        this.bulkSending(context, privateSessions, 'private');
      } else {
        await context.reply(cancelMessageSending);
      }
    };
  }

  /**
   * @param {GrammyContext} context
   * @param {ChatSession[]} sessions
   * @param {string} type
   * */
  bulkSending(context: GrammyContext, sessions: ChatSession[], type: string) {
    const updatesMessage = context.session.updatesText;
    const updatesMessageEntities = context.session.textEntities;

    const totalCount = sessions.length;
    const chunkSize = Math.ceil(totalCount / 10);

    let sentCount = 0;

    sessions.forEach((chartSession) => {
      queueService.sendMessage(chartSession.id, updatesMessage || '', { entities: updatesMessageEntities ?? undefined });
      sentCount += 1;
      if (sentCount % chunkSize === 0) {
        queueService.sendMessage(context.from?.id.toString() || '', getUpdateMessage({ totalCount, sentCount, type }));
      }
      if (sentCount === totalCount) {
        queueService.sendMessage(context.from?.id.toString() || '', getSuccessfulMessage({ totalCount, sentCount }));
      }
    });
  }
}
