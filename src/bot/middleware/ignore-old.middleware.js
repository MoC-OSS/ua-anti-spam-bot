const ignoreOld =
  (threshold = 5 * 60) =>
  (ctx, next) => {
    if (ctx.msg?.date && new Date().getTime() / 1000 - ctx.msg.date > threshold) {
      console.info(`Ignoring message from user ${ctx.from?.id} at chat ${ctx.chat?.id} (${new Date().getTime() / 1000}:${ctx.msg.date})`);
      return;
    }

    return next();
  };

module.exports = {
  ignoreOld,
};
