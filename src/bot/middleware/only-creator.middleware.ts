import { creatorId } from '../../creator';
import { getDeclinedMassSendingMessage } from '../../message';

/**
 * @description
 * Allow actions only for bot creator
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
export function onlyCreator(ctx, next) {
  if (ctx.from.id === creatorId) {
    return next();
  }

  ctx.reply(getDeclinedMassSendingMessage);
}

module.exports = {
  onlyCreator,
};
