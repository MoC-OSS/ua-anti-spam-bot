const { Menu } = require('@grammyjs/menu');
const { apiThrottler } = require('@grammyjs/transformer-throttler');

const { redisClient } = require('../../db');
const {
  getUpdatesMessage,
  getConfirmationMessage,
  getSuccessfulMessage,
  cancelMessageSending,
  getDeclinedMassSendingMessage,
} = require('../../message');
const { handleError } = require('../../utils');
const { creatorId } = require('../../creator');

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
      if (ctx.chat.type === 'private' && ctx.chat.id === creatorId) {
        // id 143875991 / creatorId for test;
        ctx.session.step = 'confirmation';
        ctx.replyWithHTML(getUpdatesMessage());
      } else {
        ctx.reply(getDeclinedMassSendingMessage);
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
        const throttler = apiThrottler();
        ctx.api.config.use(throttler);

        const updatesMessage = ctx.session.updatesText;
        const sessions = await redisClient.getAllRecords();
        const getChatId = (sessionId) => sessionId.split(':')[0];
        const onlyUniqueSessions = sessions.filter(
          (session, index, self) => index === self.findIndex((t) => getChatId(t.id) === getChatId(session.id)),
        );
        const privateAndSuperGroupsSessions = onlyUniqueSessions.filter(
          (session) => session.data.chatType === 'private' || session.data.chatType === 'supergroup',
        );
        const totalCount = privateAndSuperGroupsSessions.length;

        privateAndSuperGroupsSessions.forEach(async (e) => {
          ctx.api.sendMessage(e.id, updatesMessage).catch((error) => {
            console.error('This bot was blocked or kicked from this chat!');
            handleError(error);
          });
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
