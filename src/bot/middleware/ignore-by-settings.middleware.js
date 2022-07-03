/**
 * @param {keyof ChatSessionData['chatSettings']} key
 *
 * @returns {GrammyMiddleware}
 * */
const ignoreBySettingsMiddleware = (key) => async (ctx, next) => {
  if (ctx.chatSession.chatSettings[key] !== true) {
    await next();
  }
};

module.exports = {
  ignoreBySettingsMiddleware,
};
