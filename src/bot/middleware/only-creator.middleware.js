const { creatorId } = require('../../creator');
const { getDeclinedMassSendingMessage } = require('../../message');

/**
 * @description
 * Allow actions only for bot creator
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
function onlyCreator(ctx, next) {
  if (ctx.from.id === creatorId) {
    return next();
  }

  ctx.reply(getDeclinedMassSendingMessage);
}

module.exports = {
  onlyCreator,
};
