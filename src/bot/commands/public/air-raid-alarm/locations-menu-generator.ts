import type { MenuRange } from '@grammyjs/menu';

import { onlyAdmin } from '@bot/middleware/only-admin.middleware';

import { getAirRaidAlarmSettingsMessage } from '@message';

import { generateTestState } from '@services/_mocks/alarm.mocks';
import { TEST_ALARM_STATE } from '@services/alarm.service';
import { alarmChatService } from '@services/alarm-chat.service';

import type { State } from '@app-types/alarm';
import type { GrammyContext, GrammyMenuContext } from '@app-types/context';

import { handleError } from '@utils/error-handler';
import { isIdWhitelisted } from '@utils/generic.util';

/**
 * @param {GrammyContext} _context
 * @param {MenuRange<GrammyContext>} range
 * @param alertStates
 * */
export const dynamicLocationMenu = (_context: GrammyMenuContext, range: MenuRange<GrammyMenuContext>, alertStates: State[]) => {
  const states = isIdWhitelisted(_context.from?.id) ? [...alertStates, generateTestState(TEST_ALARM_STATE)] : alertStates;
  const pageIndex = _context.chatSession.chatSettings.airRaidAlertSettings.pageNumber;
  const { state } = _context.chatSession.chatSettings.airRaidAlertSettings;
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

      context
        .editMessageText(getAirRaidAlarmSettingsMessage(context, _context.chatSession.chatSettings), { parse_mode: 'HTML' })
        .catch(handleError);
    });
  }

  function createNextButton() {
    return range.text(_context.t('pagination-next-page'), onlyAdmin, (context) => {
      context.menu.update();
      context.chatSession.chatSettings.airRaidAlertSettings.pageNumber += 1;
    });
  }

  function createPreviousButton() {
    return range.text(_context.t('pagination-previous-page'), onlyAdmin, (context) => {
      context.menu.update();
      context.chatSession.chatSettings.airRaidAlertSettings.pageNumber -= 1;
    });
  }

  if (states.length - buttonIndex < 10) {
    currentButtonsLimit = lastPageButtonsLimit;
  }

  for (buttonIndex; buttonIndex < currentButtonsLimit; buttonIndex += 1) {
    // eslint-disable-next-line security/detect-object-injection
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
