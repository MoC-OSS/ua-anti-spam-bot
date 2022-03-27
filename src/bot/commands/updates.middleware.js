const { getUpdatesMessage } = require('../../message');
// const { creatorId } = require('../../creator');

class UpdatesMiddleware {
  middleware() {
    /**
     * @param {GrammyContext} ctx
     * */
    return (ctx) => {
      if (ctx.chat.type === 'private' && ctx.chat.id === 143875991) {
        // creatorId
        ctx.session.step = 'updatesInput';
        return ctx.replyWithHTML(getUpdatesMessage());
      }
    };
  }
}
module.exports = {
  UpdatesMiddleware,
};
