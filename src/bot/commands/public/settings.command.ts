import {
  airAlarmAlertButton,
  airAlarmNotificationMessage,
  blockWhenAlarm,
  deleteMessageButton,
  deleteSwindlerButton,
  deleteTensorButton,
  deleteUrlsButton,
  getAirRaidAlarmSettingsMessage,
  getSettingsMenuMessage,
  goBackButton,
  selectYourState,
  settingsSubmitMessage,
  turnOffChatWhileAlarmButton,
} from '../../../message';
import { alarmChatService } from '../../../services';
import type { ChatSessionData, GrammyContext, GrammyMiddleware, State } from '../../../types';
import { onlyAdmin } from '../../middleware';
import { MiddlewareMenu } from '../../middleware-menu.menu';

import { dynamicLocationMenu } from './air-raid-alarm/locations-menu-generator';

const toggleSetting = (context: GrammyContext, key: keyof Omit<ChatSessionData['chatSettings'], 'airRaidAlertSettings'>) => {
  context.chatSession.chatSettings[key] = !context.chatSession.chatSettings[key];
  const newText = getSettingsMenuMessage(context.chatSession.chatSettings);

  if (context.msg?.text !== newText) {
    return context.editMessageText(newText, { parse_mode: 'HTML' });
  }
};

const isStateSelected: GrammyMiddleware = (context, next) => {
  const { state } = context.chatSession.chatSettings.airRaidAlertSettings;

  if (!state) {
    return context.answerCallbackQuery({
      text: selectYourState,
      show_alert: true,
    });
  }

  return next();
};

const isAlarmNow: GrammyMiddleware = async (context, next) => {
  const isAlarm = alarmChatService.isAlarmNow(context.chatSession.chatSettings.airRaidAlertSettings.state || '');
  if (isAlarm) {
    await context.answerCallbackQuery({
      text: blockWhenAlarm,
      show_alert: true,
    });
  } else {
    return next();
  }
};

export class SettingsCommand {
  /**
   * @param {State[]} airRaidAlarmStates
   * */
  settingsMenuObj: MiddlewareMenu | null;

  settingsDescriptionObj: MiddlewareMenu | null;

  settingsAirRaidAlertObj: MiddlewareMenu | null;

  constructor(private airRaidAlarmStates: State[]) {
    this.settingsMenuObj = null;
    this.settingsDescriptionObj = null;
    this.settingsAirRaidAlertObj = null;
  }

  initMenu() {
    /**
     * @param {GrammyContext} context
     * @param {keyof ChatSessionData['chatSettings']} key
     * */

    this.settingsMenuObj = new MiddlewareMenu('settingsMenu', { autoAnswer: false })
      .addGlobalMiddlewares(onlyAdmin)
      .text(deleteTensorButton, (context) => toggleSetting(context, 'disableStrategicInfo'))
      .text(deleteMessageButton, (context) => toggleSetting(context, 'disableDeleteMessage'))
      .text(deleteSwindlerButton, (context) => toggleSetting(context, 'disableSwindlerMessage'))
      .row()
      .text(deleteUrlsButton, (context) => toggleSetting(context, 'enableDeleteUrls'))
      .row()
      .text(airAlarmAlertButton, isAlarmNow, async (context) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        context.menu.nav('settingsAirRaidAlertSubmenu');
        await context.editMessageText(getAirRaidAlarmSettingsMessage(context.chatSession.chatSettings), { parse_mode: 'HTML' });
      })
      .text(airAlarmNotificationMessage, isAlarmNow, isStateSelected, async (context) => {
        context.chatSession.chatSettings.airRaidAlertSettings.notificationMessage =
          !context.chatSession.chatSettings.airRaidAlertSettings.notificationMessage;
        alarmChatService.updateChat(context.chatSession, context.chat?.id);
        const newText = getSettingsMenuMessage(context.chatSession.chatSettings);

        if (context.msg?.text !== newText) {
          await context.editMessageText(newText, { parse_mode: 'HTML' });
        }
      })
      .text(turnOffChatWhileAlarmButton, isAlarmNow, isStateSelected, async (context) => {
        await toggleSetting(context, 'disableChatWhileAirRaidAlert');
        alarmChatService.updateChat(context.chatSession, context.chat?.id);
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
      .back(goBackButton, (context) =>
        context.editMessageText(getSettingsMenuMessage(context.chatSession.chatSettings), { parse_mode: 'HTML' }),
      );

    return this.settingsAirRaidAlertObj;
  }

  initDescriptionSubmenu() {
    this.settingsDescriptionObj = new MiddlewareMenu('settingsDescriptionSubmenu')
      .addGlobalMiddlewares(onlyAdmin)
      .back(goBackButton, (context) =>
        context.editMessageText(getSettingsMenuMessage(context.chatSession.chatSettings), { parse_mode: 'HTML' }),
      );

    return this.settingsDescriptionObj;
  }

  sendSettingsMenu(): GrammyMiddleware {
    /**
     * @param {GrammyContext} context
     * */

    return async (context) => {
      if (this.settingsMenuObj) {
        await context
          .replyWithHTML(getSettingsMenuMessage(context.chatSession.chatSettings), { reply_markup: this.settingsMenuObj })
          .catch((error: Error) => {
            console.info(`sendSettingsMenu error ${error.message}`);
          });
      }
    };
  }
}
