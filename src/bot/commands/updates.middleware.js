const { Menu } = require('@grammyjs/menu');
const { apiThrottler } = require('@grammyjs/transformer-throttler');

const { redisClient } = require('../../db');
const { getUpdatesMessage, getSuccessfulMessage, cancelMessageSending, confirmationMessage } = require('../../message');
const { handleError } = require('../../utils');

class UpdatesMiddleware {
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
    return (ctx) => {
      ctx.session.step = 'confirmation';
      ctx.replyWithHTML(getUpdatesMessage());
    };
  }

  confirmation() {
    /**
     * @param {GrammyContext} ctx
     * */
    return async (ctx) => {
      const userInput = ctx.msg?.text;
      const textEntities = ctx.msg?.entities;
      ctx.session.updatesText = userInput;
      ctx.session.textEntities = textEntities ?? null;
      ctx.session.step = 'messageSending';
      await ctx.reply(confirmationMessage);
      await ctx.reply(userInput, { entities: textEntities ?? null, reply_markup: this.menu });
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
        const updatesMessageEntities = ctx.session.textEntities;
        const sessions = await redisClient.getAllRecords();
        const onlyUniqueSessions = sessions.filter((session) => Number.isNaN(+session));
        const privateAndSuperGroupsSessions = onlyUniqueSessions.filter(
          (session) => session.data.chatType === 'private' || session.data.chatType === 'supergroup',
        );
        const totalCount = privateAndSuperGroupsSessions.length;

        privateAndSuperGroupsSessions.forEach(async (e) => {
          ctx.api.sendMessage(e.id, updatesMessage, { entities: updatesMessageEntities ?? null }).catch((error) => {
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
