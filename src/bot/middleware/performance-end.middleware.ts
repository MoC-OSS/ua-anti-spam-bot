import type { NextFunction } from 'grammy';

import { environmentConfig } from '@shared/config';

import type { GrammyContext } from '@app-types/context';

/**
 * Used for performance checking
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export async function performanceEndMiddleware(context: GrammyContext, next: NextFunction) {
  if (environmentConfig.DEBUG) {
    return context
      .reply(
        [
          `<b>Time</b>: ${performance.now() - (context.state?.performanceStart || 0)}`,
          '',
          'Start:',
          context.state.performanceStart,
          '',
          'End:',
          performance.now(),
        ].join('\n'),
        { parse_mode: 'HTML' },
      )

      .then(() => next());
  }

  return next();
}
