/**
 * @description
 * Skip messages without text
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
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
