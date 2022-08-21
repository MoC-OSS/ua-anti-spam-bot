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
  selectYourState,
  // settingsDescriptionButton,
  // detailedSettingsDescription,
  goBackButton,
  blockWhenAlarm,
} = require('../../message');
const { onlyAdmin } = require('../middleware');
const { MiddlewareMenu } = require('../middleware-menu.menu');
const { handleError } = require('../../utils');
const dynamicLocationMenu = require('./air-raid-alarm');
const { alarmChatService } = require('../../services/alarm-chat.service');

class SettingsMiddleware {
  /**
   * @param {State[]} airRaidAlarmStates
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

    const isStateSelected = (ctx) => {
      const { state } = ctx.chatSession.chatSettings.airRaidAlertSettings;
      if (!state) {
        ctx
          .answerCallbackQuery({
            text: selectYourState,
            show_alert: true,
          })
          .catch(handleError);
        return false;
      }
      return true;
    };

    this.settingsMenuObj = new MiddlewareMenu('settingsMenu', { autoAnswer: false })
      .addGlobalMiddlewares(onlyAdmin)
      .text(deleteTensorButton, (ctx) => toggleSetting(ctx, 'disableStrategicInfo'))
      .text(deleteMessageButton, (ctx) => toggleSetting(ctx, 'disableDeleteMessage'))
      .text(deleteSwindlerButton, (ctx) => toggleSetting(ctx, 'disableSwindlerMessage'))
      .row()
      .submenu(airAlarmAlertButton, 'settingsAirRaidAlertSubmenu', (ctx) => {
        ctx.editMessageText(getAirRaidAlarmSettingsMessage(ctx.chatSession.chatSettings), { parse_mode: 'HTML' }).catch(handleError);
      })
      .text(airAlarmNotificationMessage, (ctx) => {
        if (isStateSelected(ctx) && !this.isAlarmNow(ctx)) {
          ctx.chatSession.chatSettings.airRaidAlertSettings.notificationMessage =
            ctx.chatSession.chatSettings.airRaidAlertSettings.notificationMessage === false;
          alarmChatService.updateChat(ctx.chatSession, ctx.chat.id);
          const newText = getSettingsMenuMessage(ctx.chatSession.chatSettings);

          if (ctx.msg.text !== newText) {
            ctx.editMessageText(newText, { parse_mode: 'HTML' }).catch(handleError);
          }
        }
      })
      .text(turnOffChatWhileAlarmButton, (ctx) => {
        if (isStateSelected(ctx) && !this.isAlarmNow(ctx)) {
          toggleSetting(ctx, 'disableChatWhileAirRaidAlert');
          alarmChatService.updateChat(ctx.chatSession, ctx.chat.id);
        }
      })
      // TODO UABOT-2 COMMENT UNTIL DESCRIPTION WILL BE AVAILABLE
      // .row()
      // .submenu(settingsDescriptionButton, 'settingsDescriptionSubmenu', (ctx) => {
      //   ctx.editMessageText(detailedSettingsDescription).catch(handleError);
      // })
      .row()
      .text(settingsSubmitMessage, (ctx) => ctx.deleteMessage());

    return this.settingsMenuObj;
  }

  isAlarmNow(ctx) {
    const isAlarm = alarmChatService.isAlarmNow(ctx.chatSession.chatSettings.airRaidAlertSettings.state);
    if (isAlarm) {
      ctx
        .answerCallbackQuery({
          text: blockWhenAlarm,
          show_alert: true,
        })
        .catch(handleError);
      return true;
    }
    return false;
  }

  initAirRaidAlertSubmenu() {
    this.settingsAirRaidAlertObj = new MiddlewareMenu('settingsAirRaidAlertSubmenu')
      .addGlobalMiddlewares(onlyAdmin)
      .dynamic((ctx, range) => {
        if (!this.isAlarmNow(ctx)) {
          return dynamicLocationMenu(ctx, range, this.airRaidAlarmStates);
        }
      })
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
