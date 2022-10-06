import { logSkipMiddleware } from '../../utils';

/**
 * Used for performance checking
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
export function botActiveMiddleware(context, next) {
  // TODO use for ctx prod debug
  // console.info('enter botActiveMiddleware ******', ctx.chat?.title, '******', ctx.state.text);

  if (context.chat.type !== 'private' && !context.chatSession.botRemoved && context.chatSession.isBotAdmin) {
    return next();
  }

  if (context.chat.type === 'private') {
    return next();
  }

  logSkipMiddleware(context, 'bot kicked or not admin', context.chatSession);
}
