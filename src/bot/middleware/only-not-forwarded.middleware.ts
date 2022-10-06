import { logSkipMiddleware } from '../../utils';

/**
 * @description
 * Allow to skip a forwarded message
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
export async function onlyNotForwarded(context, next) {
  // TODO use for ctx prod debug
  // console.info('enter onlyNotForwarded ******', ctx.chat?.title, '******', ctx.state.text);

  /**
   * Skip forwarded messages
   * */
  if (context.update?.message?.forward_from) {
    logSkipMiddleware(context, 'regular forward');
    return;
  }

  return next();
}
