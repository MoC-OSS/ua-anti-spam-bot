import type { GrammyMiddleware } from '@app-types/context';

import { removeSystemInformationUtility } from '@utils/remove-system-information.util';

/**
 * Middleware function that removes system information from the text stored in the context state.
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export const removeSystemInformationMiddleware: GrammyMiddleware = (context, next) => {
  if (context.state.text) {
    context.state.clearText = removeSystemInformationUtility(context.state.text);
  }

  return next();
};
