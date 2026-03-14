import type { GrammyMiddleware } from '@types/';

import { removeSystemInformationUtil as removeSystemInformationUtility } from '@utils/';

/**
 * Middleware function that removes system information from the text stored in the context state.
 */
export const removeSystemInformationMiddleware: GrammyMiddleware = (context, next) => {
  if (context.state.text) {
    context.state.clearText = removeSystemInformationUtility(context.state.text);
  }

  return next();
};
