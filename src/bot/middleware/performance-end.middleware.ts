import type { NextFunction } from 'grammy';

import type { GrammyContext } from '@types/';

import { environmentConfig } from '../../config';

/**
 * Used for performance checking
 * */
export async function performanceEndMiddleware(context: GrammyContext, next: NextFunction) {
  if (environmentConfig.DEBUG) {
    await context
      .replyWithHTML(
        [
          `<b>Time</b>: ${performance.now() - (context.state?.performanceStart || 0)}`,
          '',
          'Start:',
          context.state.performanceStart,
          '',
          'End:',
          performance.now(),
        ].join('\n'),
      )

      .then(() => next());
  } else {
    return next();
  }
}
