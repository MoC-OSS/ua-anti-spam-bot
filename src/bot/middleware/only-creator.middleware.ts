import { creatorId } from '../../creator';
import { getDeclinedMassSendingMessage } from '../../message';

/**
 * @description
 * Allow actions only for bot creator
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
export function onlyCreator(context, next) {
  if (context.from.id === creatorId) {
    return next();
  }

  context.reply(getDeclinedMassSendingMessage);
}

module.exports = {
  onlyCreator,
};
