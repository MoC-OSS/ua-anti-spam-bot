const { Menu } = require('@grammyjs/menu');

const { redisClient } = require('../../db');
const { getUpdatesMessage, getConfirmationMessage, getSuccessfulMessage, cancelMessageSending } = require('../../message');
// const { creatorId } = require('../../creator');
class UpdatesMiddleware {
  constructor() {
    this.menu = null;
  }

  initMenu() {
    this.menu = new Menu('approveUpdatesMenu')
      .text({ text: 'Підтвердити', payload: 'approve' })
      .row()
      .text({ text: 'Відмінити', payload: 'cancel' });

    return this.menu;
  }

  initialization() {
    /**
     * @param {GrammyContext} ctx
     * */
    return (ctx) => {
      if (ctx.chat.type === 'private' && ctx.chat.id === 143875991) {
        // creatorId
        ctx.session.step = 'confirmation';
        return ctx.replyWithHTML(getUpdatesMessage());
      }
    };
  }

  confirmation() {
    /**
     * @param {GrammyContext} ctx
     * */
    return (ctx) => {
      const userInput = ctx.msg?.text;
      ctx.session.updatesText = userInput;
      ctx.session.step = 'messageSending';
      ctx.reply(getConfirmationMessage({ userInput }), {
        reply_markup: this.menu,
      });
    };
  }

  messageSending() {
    /**
     * @param {GrammyContext} ctx
     * */
    return async (ctx) => {
      ctx.session.step = 'idle';
      const payload = ctx.match;
      if (payload === 'approve') {
        const updatesMessage = ctx.session.updatesText;
        const sessions = await redisClient.getAllRecords();
        // console.log(sessions);
        const getChatId = (sessionId) => sessionId.split(':')[0];
        const groupOnlySessions = sessions.filter(
          (session, index, self) => index === self.findIndex((t) => getChatId(t.id) === getChatId(session.id)),
        );
        // console.log(groupOnlySessions);
        // console.log(groupOnlySessions.length);
        const privateSessions = groupOnlySessions.filter((session) => session.data.chatType === 'private');
        const superGroupsSessions = groupOnlySessions.filter((session) => session.data.chatType === 'supergroup');
        const groupSessions = groupOnlySessions.filter((session) => session.data.chatType === 'group');
        const channelSessions = groupOnlySessions.filter((session) => session.data.chatType === 'channel');

        const totalCount = privateSessions.length + superGroupsSessions.length + groupSessions.length + channelSessions.length;
        // console.log(totalCount);
        privateSessions.forEach((e) => {
          ctx.api.sendMessage(e.id, updatesMessage);
        });
        ctx.reply(getSuccessfulMessage({ totalCount }));
      } else {
        ctx.reply(cancelMessageSending);
      }
    };
  }
}

module.exports = {
  UpdatesMiddleware,
};
