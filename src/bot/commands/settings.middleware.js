const {
  getSettingsMenuMessage,
  getAirRaidAlarmSettingsMessage,
  deleteMessageButton,
  deleteSwindlerButton,
  deleteTensorButton,
  settingsSubmitMessage,
  turnOffChatWhileAlarmButton,
  airAlarmAlertButton,
  airAlarmNotificationMessage,
  // settingsDescriptionButton,
  // detailedSettingsDescription,
  goBackButton,
} = require('../../message');
const { onlyAdmin } = require('../middleware');
const { MiddlewareMenu } = require('../middleware-menu.menu');
const { handleError } = require('../../utils');
const dynamicLocationMenu = require('./air-raid-alarm');

class SettingsMiddleware {
  /**
   * @param {AlarmNotification[]} airRaidAlarmStates
   * */
  constructor(airRaidAlarmStates) {
    this.settingsMenuObj = null;
    this.settingsDescriptionObj = null;
    this.settingsAirRaidAlertObj = null;
    this.airRaidAlarmStates = airRaidAlarmStates;
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
      .text(airAlarmNotificationMessage, (ctx) => {
        ctx.chatSession.chatSettings.airRaidAlertSettings.notificationMessage =
          ctx.chatSession.chatSettings.airRaidAlertSettings.notificationMessage === false;
        const newText = getSettingsMenuMessage(ctx.chatSession.chatSettings);

        if (ctx.msg.text !== newText) {
          ctx.editMessageText(newText, { parse_mode: 'HTML' }).catch(handleError);
        }
      })
      .row()
      .text(turnOffChatWhileAlarmButton, (ctx) => {
        if (ctx.chatSession.chatSettings.disableChatWhileAirRaidAlert === true) {
          ctx.chatSession.chatSettings.airRaidAlertSettings.notificationMessage = true;
        }
        ctx.chatSession.chatSettings.disableChatWhileAirRaidAlert = ctx.chatSession.chatSettings.disableChatWhileAirRaidAlert === false;
        const newText = getSettingsMenuMessage(ctx.chatSession.chatSettings);

        if (ctx.msg.text !== newText) {
          ctx.editMessageText(newText, { parse_mode: 'HTML' }).catch(handleError);
        }
      })
      .row()
      .submenu(airAlarmAlertButton, 'settingsAirRaidAlertSubmenu', (ctx) => {
        ctx.editMessageText(getAirRaidAlarmSettingsMessage(ctx.chatSession.chatSettings), { parse_mode: 'HTML' }).catch(handleError);
      })
      // TODO UABOT-2 COMMENT UNTIL DESCRIPTION WILL BE AVAILABLE
      // .row()
      // .submenu(settingsDescriptionButton, 'settingsDescriptionSubmenu', (ctx) => {
      //   ctx.editMessageText(detailedSettingsDescription).catch(handleError);
      // })
      .row()
      .text(settingsSubmitMessage, (ctx) => {
        // console.log(ctx.chatSession.chatSettings);
        ctx.deleteMessage();
      });

    return this.settingsMenuObj;
  }

  initAirRaidAlertSubmenu() {
    this.settingsAirRaidAlertObj = new MiddlewareMenu('settingsAirRaidAlertSubmenu')
      .addGlobalMiddlewares(onlyAdmin)
      .dynamic((ctx, range) => dynamicLocationMenu(ctx, range, this.airRaidAlarmStates))
      .row()
      .back(goBackButton, (ctx) => {
        ctx.editMessageText(getSettingsMenuMessage(ctx.chatSession.chatSettings), { parse_mode: 'HTML' }).catch(handleError);
      });

    return this.settingsAirRaidAlertObj;
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
