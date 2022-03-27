const { redisClient } = require('../../db');

// const { getUpdatesMessage } = require('../../message');

class UpdatesConfirmationMiddleware {
  middleware() {
    /**
     * @param {GrammyContext} ctx
     * */
    return async (ctx) => {
      ctx.session.step = 'idle';
      const payload = ctx.match;
      if (payload === 'approve') {
        const updatesMessage = ctx.session.updatesText;
        const sessions = await redisClient.getAllRecords();
        const getChatId = (sessionId) => sessionId.split(':')[0];
        const groupOnlySessions = sessions.filter(
          (session, index, self) => index === self.findIndex((t) => getChatId(t.id) === getChatId(session.id)),
        );
        const privateSessions = groupOnlySessions.filter((session) => session.data.chatType === 'private');
        const privateCount = privateSessions.length;
        privateSessions.forEach((e) => {
          ctx.api.sendMessage(e.id, updatesMessage);
        });
        ctx.reply(`Повідомлення було успішно розіслане до ${privateCount} чатів!`);
      } else {
        ctx.reply('Розсилка була відмінена!');
      }
    };
  }
}

module.exports = {
  UpdatesConfirmationMiddleware,
};
