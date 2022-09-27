import { getDeclinedMassSendingMessage } from '../../message';
import { isIdWhitelisted } from '../../utils';

/**
 * @description
 * Allow actions only for whitelisted users
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
export function onlyWhitelisted(ctx, next) {
  if (isIdWhitelisted(ctx.from.id)) {
    return next();
  }

  ctx.reply(getDeclinedMassSendingMessage);
}

module.exports = {
  onlyWhitelisted,
};
