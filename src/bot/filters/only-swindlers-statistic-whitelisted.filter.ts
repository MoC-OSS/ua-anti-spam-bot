import type { GrammyContext } from '@app-types/context';

import { isIdWhitelistedForSwindlersStatistic } from '@utils/generic.util';

/**
 * Allow actions only for users whitelisted for swindlers statistic.
 * @param context - The Grammy context object
 * @returns True if the user is whitelisted for swindlers statistic, false otherwise
 */
export function onlySwindlersStatisticWhitelistedFilter(context: GrammyContext) {
  return isIdWhitelistedForSwindlersStatistic(context.from?.id);
}
