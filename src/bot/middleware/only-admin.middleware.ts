import { logSkipMiddleware } from '../../utils';

export const onlyAdmin = async (ctx, next) => {
  // No chat = no service
  if (!ctx.chat) {
    logSkipMiddleware(ctx, 'User is not admin');
    return;
  }
  // Channels and private chats are only postable by admins
  if (['channel', 'private'].includes(ctx.chat.type)) {
    return next();
  }
  // Anonymous users are always admins
  if (ctx.from?.username === 'GroupAnonymousBot') {
    return next();
  }
  // Surely not an admin
  if (!ctx.from?.id) {
    logSkipMiddleware(ctx, 'User is not admin');
    return;
  }
  // Check the member status
  const chatMember = await ctx.getChatMember(ctx.from.id);
  if (['creator', 'administrator'].includes(chatMember.status)) {
    return next();
  }
};

module.exports = {
  onlyAdmin,
};
