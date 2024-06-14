import type { MenuRange } from '@grammyjs/menu';

import { getAirRaidAlarmSettingsMessage, nextPage, previousPage } from '../../../../message';
import { alarmChatService, TEST_ALARM_STATE } from '../../../../services';
import { generateTestState } from '../../../../services/_mocks';
import type { GrammyContext, GrammyMenuContext, State } from '../../../../types';
import { handleError, isIdWhitelisted } from '../../../../utils';
import { onlyAdmin } from '../../../middleware';

/**
 * @param {GrammyContext} context_
 * @param {MenuRange<GrammyContext>} range
 * @param alertStates
 * */
export const dynamicLocationMenu = (context_: GrammyMenuContext, range: MenuRange<GrammyMenuContext>, alertStates: State[]) => {
  const states = isIdWhitelisted(context_.from?.id) ? [...alertStates, generateTestState(TEST_ALARM_STATE)] : alertStates;
  const pageIndex = context_.chatSession.chatSettings.airRaidAlertSettings.pageNumber;
  const { state } = context_.chatSession.chatSettings.airRaidAlertSettings;
  const maxPageIndex = Math.ceil(states.length / 10);
  const lastPageButtonsNumber = states.length % 10;
  let currentButtonsLimit = pageIndex * 10;
  let buttonIndex = pageIndex * 10 - 10;
  let columnIndex = 0;
  const lastPageButtonsLimit = buttonIndex + lastPageButtonsNumber;

  function createTextButton(locationName: string) {
    const displayLocationName = state === locationName ? `✅ ${locationName}` : locationName;
    // TODO UABOT-35 update MiddlewareMenu to handle dynamic buttons

    /**
     * @param {GrammyContext} context
     * */
    return range.text(displayLocationName, onlyAdmin, (context: GrammyContext) => {
      context.chatSession.chatSettings.airRaidAlertSettings.state = locationName;
      alarmChatService.updateChat(context.chatSession, context.chat?.id);
      context.editMessageText(getAirRaidAlarmSettingsMessage(context_.chatSession.chatSettings), { parse_mode: 'HTML' }).catch(handleError);
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
