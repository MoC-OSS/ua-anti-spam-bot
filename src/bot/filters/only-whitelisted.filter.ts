import type { GrammyContext } from '@app-types/context';

import { isIdWhitelisted } from '@utils/generic.util';

/**
 * @description
 * Allow actions only for bot whitelisted users
 * */
export function onlyWhitelistedFilter(context: GrammyContext) {
  return isIdWhitelisted(context.from?.id);
}
