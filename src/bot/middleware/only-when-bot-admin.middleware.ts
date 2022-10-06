import { logSkipMiddleware } from '../../utils';

/**
 * @description
 * Skip messages before bot became admin
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
export async function onlyWhenBotAdmin(context, next) {
  if (context.chat?.type === 'private') {
    return next();
  }

  const isMessageAfterBotAdmin = (context.msg?.date || 0) * 1000 > +new Date(context.chatSession.botAdminDate);

  if (!context.chatSession.botRemoved && isMessageAfterBotAdmin) {
    return next();
  }

  logSkipMiddleware(context, 'message is older than bot admin');
}
