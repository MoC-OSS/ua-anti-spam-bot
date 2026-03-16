import { languageDetectService } from '@services/language-detect.service';

import type { GrammyMiddleware } from '@app-types/context';

/**
 * Detects whether the message text is in Russian and stores the result in `context.state.isRussian`.
 * Always calls `next()`.
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export const parseIsRussian: GrammyMiddleware = async (context, next) => {
  if (context.state.isRussian === undefined) {
    context.state.isRussian = languageDetectService.isRussian(context.state.text || '');
  }

  return next();
};
