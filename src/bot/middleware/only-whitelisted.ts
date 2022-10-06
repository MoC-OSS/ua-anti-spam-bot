import { getDeclinedMassSendingMessage } from '../../message';
import { isIdWhitelisted } from '../../utils';

/**
 * @description
 * Allow actions only for whitelisted users
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
export function onlyWhitelisted(context, next) {
  if (isIdWhitelisted(context.from.id)) {
    return next();
  }

  context.reply(getDeclinedMassSendingMessage);
}

module.exports = {
  onlyWhitelisted,
};
