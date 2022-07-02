const {
  getSettingsMenuMessage,
  deleteMessageButton,
  settingsSubmitMessage,
  settingsDescriptionButton,
  detailedSettingsDescription,
  goBackButton,
} = require('../../message');
const { onlyAdmin } = require('../middleware');
const { MiddlewareMenu } = require('../middleware-menu.menu');

class SettingsMiddleware {
  constructor() {
    this.settingsMenuObj = null;
    this.settingsDescriptionObj = null;
  }

  initMenu() {
    this.settingsMenuObj = new MiddlewareMenu('settingsMenu')
      .addGlobalMiddlewares(onlyAdmin)
      .text(deleteMessageButton, (ctx) => {
        if (ctx.chatSession.chatSettings.enableDeleteMessage === false) {
          ctx.chatSession.chatSettings.enableDeleteMessage = true;
        } else {
          ctx.chatSession.chatSettings.enableDeleteMessage = false;
        }

        ctx.editMessageText(getSettingsMenuMessage(ctx.chatSession.chatSettings));
      })
      .row()
      .submenu(settingsDescriptionButton, 'settingsDescriptionSubmenu', (ctx) => {
        ctx.editMessageText(detailedSettingsDescription);
      })
      .row()
      .text(settingsSubmitMessage, (ctx) => {
        ctx.deleteMessage();
      });

    return this.settingsMenuObj;
  }

  initDescriptionSubmenu() {
    this.settingsDescriptionObj = new MiddlewareMenu('settingsDescriptionSubmenu')
      .addGlobalMiddlewares(onlyAdmin)
      .back(goBackButton, (ctx) => {
        ctx.editMessageText(getSettingsMenuMessage(ctx.chatSession.chatSettings));
      });

    return this.settingsDescriptionObj;
  }

  sendSettingsMenu() {
    /**
     * @param {GrammyContext} ctx
     * */
    const middleware = async (ctx) => {
      ctx.reply(getSettingsMenuMessage(ctx.chatSession.chatSettings), { reply_markup: this.settingsMenuObj }).catch(() => {});
    };

    return middleware;
  }
}

module.exports = {
  SettingsMiddleware,
};
