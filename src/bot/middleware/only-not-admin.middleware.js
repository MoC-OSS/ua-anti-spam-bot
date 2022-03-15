const TELEGRAM_FORWARD_USER_ID = 777000;

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
    return;
  }

  /**
   * Skip channel admins message duplicated in chat
   * */
  if (ctx.chat.type === 'channel') {
    return;
  }

  /**
   * Skip channel post when bot in channel
   * On message doesn't handle user posts
   * */
  if (ctx.update?.channel_post?.sender_chat?.type === 'channel') {
    return;
  }

  /**
   * Anonymous users are always admins
   */
  if (ctx.from?.username === 'GroupAnonymousBot') {
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
