/**
 * @description
 * Skip messages without text
 * */
function onlyWithText(ctx, next) {
  const text = ctx.msg.text || ctx.msg.caption;
  if (text) {
    ctx.state.text = text;
    return next();
  }
}

module.exports = {
  onlyWithText,
};
