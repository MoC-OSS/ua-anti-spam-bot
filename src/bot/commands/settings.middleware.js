const { Menu } = require('@grammyjs/menu');

const {
  getSettingsMenuMessage,
  deleteMessageButton,
  settingsSubmitMessage,
  settingsDescriptionButton,
  detailedSettingsDescription,
  goBackButton,
} = require('../../message');
const { onlyAdmin } = require('../middleware');

class SettingsMiddleware {
  constructor() {
    this.settingsMenuObj = null;
    this.settingsDescriptionObj = null;
  }

  initMenu() {
    this.settingsMenuObj = new Menu('settingsMenu')
      .text(deleteMessageButton, onlyAdmin, (ctx) => {
        if (ctx.chatSession.chatSettings.enableDeleteMessage === false) {
          ctx.chatSession.chatSettings.enableDeleteMessage = true;
        } else {
          ctx.chatSession.chatSettings.enableDeleteMessage = false;
        }

        ctx.editMessageText(getSettingsMenuMessage(ctx.chatSession.chatSettings));
      })
      .row()
      .submenu(settingsDescriptionButton, 'settingsDescriptionSubmenu', onlyAdmin, (ctx) => {
        ctx.editMessageText(detailedSettingsDescription);
      })
      .row()
      .text(settingsSubmitMessage, onlyAdmin, (ctx) => {
        ctx.deleteMessage();
      });

    return this.settingsMenuObj;
  }

  initDescriptionSubmenu() {
    this.settingsDescriptionObj = new Menu('settingsDescriptionSubmenu').back(goBackButton, (ctx) => {
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
