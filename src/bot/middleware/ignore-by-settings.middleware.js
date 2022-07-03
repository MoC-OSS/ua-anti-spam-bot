/**
 * @param {keyof ChatSessionData['chatSettings']} key
 * */
const ignoreBySettingsMiddleware = (key) => {
  /**
   * @type {GrammyMiddleware}
   * */
  const middleware = async (ctx, next) => {
    if (ctx.chatSession.chatSettings[key] !== true) {
      await next();
    }
  };

  return middleware;
};

module.exports = {
  ignoreBySettingsMiddleware,
};
