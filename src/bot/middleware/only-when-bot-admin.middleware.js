/**
 * @description
 * Skip messages before bot became admin
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
async function onlyWhenBotAdmin(ctx, next) {
  if (ctx.chat?.type === 'private') {
    return next();
  }

  if ((ctx.msg?.date || 0) * 1000 < +ctx.session.botAdminDate) {
    return next();
  }
}

module.exports = {
  onlyWhenBotAdmin,
};
