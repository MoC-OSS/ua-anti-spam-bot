const { logSkipMiddleware } = require('../../utils');

const TELEGRAM_FORWARD_USER_ID = 777000;
const CHANNEL_BOT_ID = 136817688;

/**
 * @description
 * Allow to execute next middlewares only if the user is not admin
 *
 * Reversed copy from
 * @see https://github.com/backmeupplz/grammy-middlewares/blob/main/src/middlewares/onlyAdmin.ts
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
async function onlyNotAdmin(ctx, next) {
  // TODO use for ctx prod debug
  // console.info('enter onlyNotAdmin ******', ctx.chat?.title, '******', ctx.state.text);

  /**
   * No chat - process the user
   * */
  if (!ctx.chat) {
    return next();
  }

  /**
   * Handle forwarded messages from channel into channel's chat
   * */
  if (ctx.from?.id === TELEGRAM_FORWARD_USER_ID) {
    logSkipMiddleware(ctx, 'chat channel forward');
    return;
  }

  /**
   * Skip channel admins message duplicated in chat
   * */
  if (ctx.chat.type === 'channel') {
    logSkipMiddleware(ctx, 'channel chat type');
    return;
  }

  /**
   * Skip channel post when bot in channel
   * On message doesn't handle user posts
   * */
  if (ctx.update?.channel_post?.sender_chat?.type === 'channel') {
    logSkipMiddleware(ctx, 'channel');
    return;
  }

  /**
   * Anonymous users are always admins
   */
  if (ctx.from?.username === 'GroupAnonymousBot') {
    logSkipMiddleware(ctx, 'GroupAnonymousBot');
    return;
  }

  /**
   * If no id - not an admin
   * */
  if (!ctx.from?.id) {
    return next();
  }

  /**
   * Check if the is admin. If so, skip.
   * */
  const chatMember = await ctx.getChatMember(ctx.from.id);
  if (['creator', 'administrator'].includes(chatMember.status)) {
    logSkipMiddleware(ctx, 'Admin');
    return;
  }

  /**
   * For public channels Telegram could send the message from channel as Channel_Bot.
   * It means an admin wrote the message so we need to skip it.
   * https://github.com/42wim/matterbridge/issues/1654
   * */
  if (ctx.from?.id === CHANNEL_BOT_ID || ctx.from?.username === 'Channel_Bot') {
    logSkipMiddleware(ctx, 'Channel_Bot');
    return;
  }

  /**
   * Sure not admin.
   * Either a regular chat user or private message.
   * */
  return next();
}

module.exports = {
  onlyNotAdmin,
};
