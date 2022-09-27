import { env } from 'typed-dotenv'.config();

/**
 * Used for performance checking
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
export function performanceEndMiddleware(ctx, next) {
  if (env.DEBUG) {
    ctx
      .replyWithHTML(
        [
          `<b>Time</b>: ${performance.now() - ctx.state.performanceStart}`,
          '',
          'Start:',
          ctx.state.performanceStart,
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
