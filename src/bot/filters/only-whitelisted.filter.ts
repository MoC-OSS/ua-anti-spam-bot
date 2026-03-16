import type { GrammyContext } from '@app-types/context';

import { isIdWhitelisted } from '@utils/generic.util';

/**
 * Allow actions only for whitelisted users.
 * @param context - The Grammy context object
 * @returns True if the user is whitelisted, false otherwise
 */
export function onlyWhitelistedFilter(context: GrammyContext) {
  return isIdWhitelisted(context.from?.id);
}
