import { GrammyContext } from '../../../types';
import { MenuRange } from '@grammyjs/menu';
import { State } from '../../../types/alarm';

const { getAirRaidAlarmSettingsMessage, nextPage, previousPage } = require('../../../message');

const { handleError, isIdWhitelisted } = require('../../../utils');
const { onlyAdmin } = require('../../middleware');
const { alarmChatService } = require('../../../services/alarm-chat.service');
const { generateTestState } = require('../../../services/_mocks/alarm.mocks');
const { TEST_ALARM_STATE } = require('../../../services/alarm.service');

/**
 * @param {GrammyContext} ctx
 * @param {MenuRange<GrammyContext>} range
 * @param alertStates
 * */
export const dynamicLocationMenu = async (ctx: GrammyContext, range: MenuRange<GrammyContext>, alertStates: State[]) => {
  const states = isIdWhitelisted(ctx.from?.id) ? [...alertStates, generateTestState(TEST_ALARM_STATE)] : alertStates;
  const pageIndex = ctx.chatSession.chatSettings.airRaidAlertSettings.pageNumber;
  const { state } = ctx.chatSession.chatSettings.airRaidAlertSettings;
  const maxPageIndex = Math.ceil(states.length / 10);
  const lastPageButtonsNumber = states.length % 10;
  let currentButtonsLimit = pageIndex * 10;
  let buttonIndex = pageIndex * 10 - 10;
  let columnIndex = 0;
  const lastPageButtonsLimit = buttonIndex + lastPageButtonsNumber;

  function createTextButton(locationName) {
    const displayLocationName = state === locationName ? `✅ ${locationName}` : locationName;
    // TODO UABOT-35 update MiddlewareMenu to handle dynamic buttons

    /**
     * @param {GrammyContext} context
     * */
    return range.text(displayLocationName, onlyAdmin, (context) => {
      context.chatSession.chatSettings.airRaidAlertSettings.state = locationName;
      alarmChatService.updateChat(context.chatSession, context.chat?.id);
      context.editMessageText(getAirRaidAlarmSettingsMessage(ctx.chatSession.chatSettings), { parse_mode: 'HTML' }).catch(handleError);
    });
  }

  function createNextButton() {
    return range.text(nextPage, onlyAdmin, (context) => {
      context.menu.update();
      context.chatSession.chatSettings.airRaidAlertSettings.pageNumber += 1;
    });
  }

  function createPreviousButton() {
    return range.text(previousPage, onlyAdmin, (context) => {
      context.menu.update();
      context.chatSession.chatSettings.airRaidAlertSettings.pageNumber -= 1;
    });
  }

  if (states.length - buttonIndex < 10) {
    currentButtonsLimit = lastPageButtonsLimit;
  }

  for (buttonIndex; buttonIndex < currentButtonsLimit; buttonIndex += 1) {
    const locationName = states[buttonIndex].name;

    if (columnIndex % 2 === 0) {
      if (currentButtonsLimit === buttonIndex + 1) {
        createTextButton(locationName).row();
      } else {
        createTextButton(locationName);
      }
    } else {
      createTextButton(locationName).row();
    }

    columnIndex += 1;
  }

  if (pageIndex === 1) {
    createNextButton();
  } else if (pageIndex > 1 && pageIndex !== maxPageIndex) {
    createPreviousButton();
    createNextButton();
  } else if (pageIndex === maxPageIndex) {
    createPreviousButton();
  }
};

module.exports = dynamicLocationMenu;
