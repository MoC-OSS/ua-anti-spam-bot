const { getAirRaidAlarmSettingsMessage, nextPage, previousPage } = require('../../../message');

const { handleError } = require('../../../utils');

const dynamicLocationMenu = async (ctx, range, states) => {
  const pageIndex = ctx.chatSession.chatSettings.airRaidAlertSettings.airRaidAlertPageNumber;
  const maxPageIndex = Math.ceil(states.length / 10);
  const currentButtonsLimit = pageIndex * 10;
  const lastPageButtonsNumber = states.length % 10;
  let buttonIndex = pageIndex * 10 - 10;
  let columnIndex = 0;

  function createTextButton(locationName) {
    return range.text(locationName, (context) => {
      context.chatSession.chatSettings.airRaidAlertSettings.chatAlarmLocation = locationName;
      context.editMessageText(getAirRaidAlarmSettingsMessage(ctx.chatSession.chatSettings), { parse_mode: 'HTML' }).catch(handleError);
    });
  }

  if (pageIndex === 1) {
    for (buttonIndex; buttonIndex < currentButtonsLimit; buttonIndex += 1) {
      const locationName = states[buttonIndex].name;
      if (columnIndex % 2 === 0) {
        createTextButton(locationName);
      } else {
        createTextButton(locationName).row();
      }
      columnIndex += 1;
    }
    range.text(nextPage, (context) => {
      context.menu.update();
      context.chatSession.chatSettings.airRaidAlertSettings.airRaidAlertPageNumber += 1;
    });
  } else if (pageIndex > 1 && pageIndex !== maxPageIndex) {
    for (buttonIndex; buttonIndex < currentButtonsLimit; buttonIndex += 1) {
      const locationName = states[buttonIndex].name;
      if (columnIndex % 2 === 0) {
        createTextButton(locationName);
      } else {
        createTextButton(locationName).row();
      }
      columnIndex += 1;
    }
    range.text(previousPage, (context) => {
      context.menu.update();
      context.chatSession.chatSettings.airRaidAlertSettings.airRaidAlertPageNumber -= 1;
    });
    range.text(nextPage, (context) => {
      context.menu.update();
      context.chatSession.chatSettings.airRaidAlertSettings.airRaidAlertPageNumber += 1;
    });
  } else if (pageIndex === maxPageIndex) {
    const lastPageButtonsLimit = buttonIndex + lastPageButtonsNumber;
    for (buttonIndex; buttonIndex < lastPageButtonsLimit; buttonIndex += 1) {
      const locationName = states[buttonIndex].name;
      if (columnIndex % 2 === 0) {
        if (lastPageButtonsLimit === buttonIndex + 1) {
          createTextButton(locationName).row();
        } else {
          createTextButton(locationName);
        }
      } else {
        createTextButton(locationName).row();
      }
      columnIndex += 1;
    }
    range.text(previousPage, (context) => {
      context.menu.update();
      context.chatSession.chatSettings.airRaidAlertSettings.airRaidAlertPageNumber -= 1;
    });
  }
};

module.exports = dynamicLocationMenu;
