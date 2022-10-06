import { alarmChatService } from '../../services/alarm-chat.service';
import type { GrammyContext } from '../../types';
import { handleError } from '../../utils';
import { onlyAdmin } from '../middleware';
import { MiddlewareMenu } from '../middleware-menu.menu';

import { dynamicLocationMenu } from './air-raid-alarm/locations-menu-generator';

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

export class SettingsMiddleware {
  /**
   * @param {State[]} airRaidAlarmStates
   * */
  settingsMenuObj: any;

  settingsDescriptionObj: any;

  settingsAirRaidAlertObj: any;

  airRaidAlarmStates: any;

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
    const toggleSetting = (context: GrammyContext, key: any) => {
      context.chatSession.chatSettings[key] = context.chatSession.chatSettings[key] === false;
      const newText = getSettingsMenuMessage(context.chatSession.chatSettings);

      if (context.msg?.text !== newText) {
        context.editMessageText(newText, { parse_mode: 'HTML' }).catch(handleError);
      }
    };

    const isStateSelected = (context) => {
      const { state } = context.chatSession.chatSettings.airRaidAlertSettings;
      if (!state) {
        context
          .answerCallbackQuery({
            text: selectYourState,
            show_alert: true,
          })
          .catch(handleError);
        return false;
      }
      return true;
    };

    const isAlarmNow = (context, next) => {
      const isAlarm = alarmChatService.isAlarmNow(context.chatSession.chatSettings.airRaidAlertSettings.state);
      if (isAlarm) {
        context
          .answerCallbackQuery({
            text: blockWhenAlarm,
            show_alert: true,
          })
          .catch(handleError);
      } else {
        return next();
      }
    };

    this.settingsMenuObj = new MiddlewareMenu('settingsMenu', { autoAnswer: false })
      .addGlobalMiddlewares(onlyAdmin)
      .text(deleteTensorButton, (context) => toggleSetting(context, 'disableStrategicInfo'))
      .text(deleteMessageButton, (context) => toggleSetting(context, 'disableDeleteMessage'))
      .text(deleteSwindlerButton, (context) => toggleSetting(context, 'disableSwindlerMessage'))
      .row()
      .text(airAlarmAlertButton, isAlarmNow, (context) => {
        context.menu.nav('settingsAirRaidAlertSubmenu');
        context
          .editMessageText(getAirRaidAlarmSettingsMessage(context.chatSession.chatSettings), { parse_mode: 'HTML' })
          .catch(handleError);
      })
      .text(airAlarmNotificationMessage, isAlarmNow, (context) => {
        if (isStateSelected(context)) {
          context.chatSession.chatSettings.airRaidAlertSettings.notificationMessage =
            context.chatSession.chatSettings.airRaidAlertSettings.notificationMessage === false;
          alarmChatService.updateChat(context.chatSession, context.chat.id);
          const newText = getSettingsMenuMessage(context.chatSession.chatSettings);

          if (context.msg.text !== newText) {
            context.editMessageText(newText, { parse_mode: 'HTML' }).catch(handleError);
          }
        }
      })
      .text(turnOffChatWhileAlarmButton, isAlarmNow, (context) => {
        if (isStateSelected(context)) {
          toggleSetting(context, 'disableChatWhileAirRaidAlert');
          alarmChatService.updateChat(context.chatSession, context.chat.id);
        }
      })
      // TODO UABOT-2 COMMENT UNTIL DESCRIPTION WILL BE AVAILABLE
      // .row()
      // .submenu(settingsDescriptionButton, 'settingsDescriptionSubmenu', (ctx) => {
      //   ctx.editMessageText(detailedSettingsDescription).catch(handleError);
      // })
      .row()
      .text(settingsSubmitMessage, (context) => context.deleteMessage());

    return this.settingsMenuObj;
  }

  initAirRaidAlertSubmenu() {
    this.settingsAirRaidAlertObj = new MiddlewareMenu('settingsAirRaidAlertSubmenu')
      .addGlobalMiddlewares(onlyAdmin)
      .dynamic((context, range) => dynamicLocationMenu(context, range, this.airRaidAlarmStates))
      .row()
      .back(goBackButton, (context) => {
        context.editMessageText(getSettingsMenuMessage(context.chatSession.chatSettings), { parse_mode: 'HTML' }).catch(handleError);
      });

    return this.settingsAirRaidAlertObj;
  }

  initDescriptionSubmenu() {
    this.settingsDescriptionObj = new MiddlewareMenu('settingsDescriptionSubmenu')
      .addGlobalMiddlewares(onlyAdmin)
      .back(goBackButton, (context) => {
        context.editMessageText(getSettingsMenuMessage(context.chatSession.chatSettings), { parse_mode: 'HTML' }).catch(handleError);
      });

    return this.settingsDescriptionObj;
  }

  sendSettingsMenu() {
    /**
     * @param {GrammyContext} ctx
     * */
    const middleware = async (context) => {
      context
        .replyWithHTML(getSettingsMenuMessage(context.chatSession.chatSettings), { reply_markup: this.settingsMenuObj })
        .catch(() => {});
    };

    return middleware;
  }
}