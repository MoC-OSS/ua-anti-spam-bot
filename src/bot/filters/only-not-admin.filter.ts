import type { GrammyContext } from 'types';

import { TELEGRAM_USER_ID } from '../../const';
import { logSkipMiddleware } from '../../utils';

/**
 * @description
 * Allow to execute next middlewares only if the user is not admin
 *
 * Reversed copy from
 * @see https://github.com/backmeupplz/grammy-middlewares/blob/main/src/middlewares/onlyAdmin.ts
 * */
export async function onlyNotAdminFilter(context: GrammyContext): Promise<boolean> {
  // TODO use for ctx prod debug
  // console.info('enter onlyNotAdmin ******', ctx.chat?.title, '******', ctx.state.text);

  /**
   * No chat - process the user
   * */
  if (!context.chat) {
    return true;
  }

  /**
   * Handle forwarded messages from channel into channel's chat
   * */
  if (context.from?.id === TELEGRAM_USER_ID) {
    logSkipMiddleware(context, 'chat channel forward');
    return false;
  }

  /**
   * Private user is not admin.
   * Bot should remove messages from private user messages.
   * */
  if (context.chat?.type === 'private') {
    return true;
  }

  /**
   * Skip channel admins message duplicated in chat
   * */
  if (context.chat?.type === 'channel') {
    logSkipMiddleware(context, 'channel chat type');
    return false;
  }

  /**
   * Skip channel post when bot in channel
   * On message doesn't handle user posts
   * */
  if (context.update?.channel_post?.sender_chat?.type === 'channel') {
    logSkipMiddleware(context, 'channel');
    return false;
  }

  /**
   * Anonymous users are always admins
   */
  if (context.from?.username === 'GroupAnonymousBot') {
    logSkipMiddleware(context, 'GroupAnonymousBot');
    return false;
  }

  const fromId = context.from?.id;

  /**
   * If no id - not an admin
   * */
  if (!fromId) {
    return true;
  }

  /**
   * Check if the is admin. If so, skip.
   * */
  const chatMember = await context.getChatMember(fromId);
  if (['creator', 'administrator'].includes(chatMember.status)) {
    logSkipMiddleware(context, 'Admin');
    return false;
  }

  /**
   * Sure not admin.
   * Either a regular chat user or private message.
   * */
  return true;
}
