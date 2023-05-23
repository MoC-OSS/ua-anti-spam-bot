import type { GrammyContext } from '../../types';
import { isIdWhitelistedForSwindlersStatistic } from '../../utils';

/**
 * @description
 * Allow actions only for bot whitelisted users
 * */
export function onlySwindlersStatisticWhitelistedFilter(context: GrammyContext) {
  return isIdWhitelistedForSwindlersStatistic(context.from?.id);
}
