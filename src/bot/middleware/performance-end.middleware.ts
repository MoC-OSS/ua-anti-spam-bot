import { environmentConfig } from 'config';
import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

/**
 * Used for performance checking
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
export async function performanceEndMiddleware(context: GrammyContext, next: NextFunction) {
  if (environmentConfig.DEBUG) {
    await context
      .replyWithHTML(
        [
          `<b>Time</b>: ${performance.now() - context?.state?.performanceStart}`,
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
