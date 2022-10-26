import type { GrammyContext } from '../../types';
import { isIdWhitelisted } from '../../utils';

/**
 * @description
 * Allow actions only for bot whitelisted users
 * */
export function onlyWhitelistedFilter(context: GrammyContext) {
  return isIdWhitelisted(context.from?.id);
}
