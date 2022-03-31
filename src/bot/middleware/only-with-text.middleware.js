/**
 * @description
 * Skip messages without text
 * */
function onlyWithText(ctx, next) {
  /**
   * Skip messages before bot became admin
   * */
  if ((ctx.msg?.date || 0) * 1000 < +ctx.session.botAdminDate) {
    return;
  }

  if (ctx.msg.text || ctx.msg.caption) {
    ctx.msg.text = ctx.msg.text || ctx.msg.caption;
    return next();
  }
}

module.exports = {
  onlyWithText,
};
