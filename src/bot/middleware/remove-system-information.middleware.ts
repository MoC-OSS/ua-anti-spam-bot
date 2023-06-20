import type { GrammyMiddleware } from '../../types';
import { removeSystemInformationUtil } from '../../utils';

/**
 * Middleware function that removes system information from the text stored in the context state.
 */
export const removeSystemInformationMiddleware: GrammyMiddleware = (context, next) => {
  if (context.state.text) {
    context.state.clearText = removeSystemInformationUtil(context.state.text);
  }

  return next();
};
