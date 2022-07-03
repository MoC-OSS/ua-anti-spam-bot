const {
  getSettingsMenuMessage,
  deleteMessageButton,
  deleteSwindlerButton,
  deleteTensorButton,
  settingsSubmitMessage,
  settingsDescriptionButton,
  detailedSettingsDescription,
  goBackButton,
} = require('../../message');
const { onlyAdmin } = require('../middleware');
const { MiddlewareMenu } = require('../middleware-menu.menu');
const { handleError } = require('../../utils');

class SettingsMiddleware {
  constructor() {
    this.settingsMenuObj = null;
    this.settingsDescriptionObj = null;
  }

  initMenu() {
    /**
     * @param {GrammyContext} ctx
     * @param {keyof ChatSessionData['chatSettings']} key
     * */
    const toggleSetting = (ctx, key) => {
      ctx.chatSession.chatSettings[key] = ctx.chatSession.chatSettings[key] === false;
      const newText = getSettingsMenuMessage(ctx.chatSession.chatSettings);

      if (ctx.msg.text !== newText) {
        ctx.editMessageText(newText, { parse_mode: 'HTML' }).catch(handleError);
      }
    };

    this.settingsMenuObj = new MiddlewareMenu('settingsMenu')
      .addGlobalMiddlewares(onlyAdmin)
      .text(deleteTensorButton, (ctx) => toggleSetting(ctx, 'disableStrategicInfo'))
      .text(deleteMessageButton, (ctx) => toggleSetting(ctx, 'disableDeleteMessage'))
      .text(deleteSwindlerButton, (ctx) => toggleSetting(ctx, 'disableSwindlerMessage'))
      .row()
      .submenu(settingsDescriptionButton, 'settingsDescriptionSubmenu', (ctx) => {
        ctx.editMessageText(detailedSettingsDescription).catch(handleError);
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
        ctx.editMessageText(getSettingsMenuMessage(ctx.chatSession.chatSettings), { parse_mode: 'HTML' }).catch(handleError);
      });

    return this.settingsDescriptionObj;
  }

  sendSettingsMenu() {
    /**
     * @param {GrammyContext} ctx
     * */
    const middleware = async (ctx) => {
      ctx.replyWithHTML(getSettingsMenuMessage(ctx.chatSession.chatSettings), { reply_markup: this.settingsMenuObj }).catch(() => {});
    };

    return middleware;
  }
}

module.exports = {
  SettingsMiddleware,
};
