import type { GrammyMiddleware } from '@app-types/context';

import { removeSystemInformationUtility } from '@utils/remove-system-information.util';

/**
 * Middleware function that removes system information from the text stored in the context state.
 * @param context
 * @param next
 */
export const removeSystemInformationMiddleware: GrammyMiddleware = (context, next) => {
  if (context.state.text) {
    context.state.clearText = removeSystemInformationUtility(context.state.text);
  }

  return next();
};
