import { env } from 'typed-dotenv'.config();

/**
 * Used for performance checking
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
export function performanceStartMiddleware(ctx, next) {
  if (env.DEBUG) {
    ctx.state.performanceStart = performance.now();
  }

  return next();
}
