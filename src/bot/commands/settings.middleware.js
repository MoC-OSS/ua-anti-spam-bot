const { Menu } = require('@grammyjs/menu');

const {
  getSettingsMenuMessage,
  deleteMessageButton,
  settingsSubmitMessage,
  settingsDescriptionButton,
  detailedSettingsDescription,
  goBackButton,
} = require('../../message');

class SettingsMiddleware {
  constructor() {
    this.settingsMenuObj = null;
    this.settingsDescriptionObj = null;
  }

  settingsMenu() {
    this.settingsMenuObj = new Menu('settingsMenu')
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

  settingsDescriptionSubmenu() {
    this.settingsDescriptionObj = new Menu('settingsDescriptionSubmenu').back(goBackButton, (ctx) => {
      ctx.editMessageText(getSettingsMenuMessage(ctx.chatSession.chatSettings));
    });

    return this.settingsDescriptionObj;
  }

  sendSettingsMenu() {
    return (ctx) => {
      ctx.reply(getSettingsMenuMessage(ctx.chatSession.chatSettings), { reply_markup: this.settingsMenuObj });
    };
  }
}

module.exports = {
  SettingsMiddleware,
};
