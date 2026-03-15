import type { GrammyContext } from '@app-types/context';

import { isIdWhitelistedForSwindlersStatistic } from '@utils/generic.util';

/**
 * @description
 * Allow actions only for bot whitelisted users
 * */
export function onlySwindlersStatisticWhitelistedFilter(context: GrammyContext) {
  return isIdWhitelistedForSwindlersStatistic(context.from?.id);
}
