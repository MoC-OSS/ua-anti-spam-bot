const {
  getSettingsMenuMessage,
  deleteMessageButton,
  deleteSwindlerButton,
  deleteTensorButton,
  settingsSubmitMessage,
  // settingsDescriptionButton,
  // detailedSettingsDescription,
  goBackButton,
} = require('../../message');
const { onlyAdmin } = require('../middleware');
const { MiddlewareMenu } = require('../middleware-menu.menu');
const { handleError } = require('../../utils');

class SettingsMiddleware {
  constructor() {
    this.settingsMenuObj = null;
    this.settingsDescriptionObj = null;
    this.settingsAirRaidAlertObj = null;
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
      .submenu('Повітряна тривога', 'settingsAirRaidAlertSubmenu', (ctx) => {
        ctx.editMessageText('detailedSettingsDescription').catch(handleError);
      })
      // TODO UABOT-2 COMMENT UNTIL DESCRIPTION WILL BE AVAILABLE
      // .row()
      // .submenu(settingsDescriptionButton, 'settingsDescriptionSubmenu', (ctx) => {
      //   ctx.editMessageText(detailedSettingsDescription).catch(handleError);
      // })
      .row()
      .text(settingsSubmitMessage, (ctx) => {
        ctx.deleteMessage();
      });

    return this.settingsMenuObj;
  }

  initAirRaidAlertSubmenu() {
    // ctx.chatSession.chatSettings.airRaidAlertSettings.airRaidAlertPageNumber = 1;
    this.settingsAirRaidAlertObj = new MiddlewareMenu('settingsAirRaidAlertSubmenu')
      .addGlobalMiddlewares(onlyAdmin)
      .dynamic(async (ctx, range) => {
        const statesObject = [
          {
            name: 'Test 1',
            id: 1,
          },
          {
            name: 'Test 2',
            id: 2,
          },
          {
            name: 'Test 3',
            id: 3,
          },
          {
            name: 'Test 4',
            id: 4,
          },
          {
            name: 'Test 5',
            id: 5,
          },
          {
            name: 'Test 6',
            id: 6,
          },
          {
            name: 'Test 7',
            id: 7,
          },
          {
            name: 'Test 8',
            id: 8,
          },
          {
            name: 'Test 9',
            id: 9,
          },
          {
            name: 'Test 10',
            id: 10,
          },
          {
            name: 'Test 11',
            id: 11,
          },
          {
            name: 'Test 12',
            id: 12,
          },
          {
            name: 'Test 1',
            id: 1,
          },
          {
            name: 'Test 2',
            id: 2,
          },
          {
            name: 'Test 3',
            id: 3,
          },
          {
            name: 'Test 4',
            id: 4,
          },
          {
            name: 'Test 5',
            id: 5,
          },
          {
            name: 'Test 6',
            id: 6,
          },
          {
            name: 'Test 7',
            id: 7,
          },
          {
            name: 'Test 8',
            id: 8,
          },
          {
            name: 'Test 9',
            id: 9,
          },
          {
            name: 'Test 10',
            id: 10,
          },
          {
            name: 'Test 11',
            id: 11,
          },
          {
            name: 'Test 12',
            id: 12,
          },
        ];
        const pageIndex = ctx.chatSession.chatSettings.airRaidAlertSettings.airRaidAlertPageNumber;
        const maxPageIndex = Math.ceil(statesObject.length / 10);
        const currentButtonsLimit = pageIndex * 10;
        const lastPageButtonsNumber = Number(String(statesObject.length / 10).slice(2, 3));
        let buttonIndex = pageIndex * 10 - 10;
        let columnIndex = 0;
        if (pageIndex === 1) {
          for (buttonIndex; buttonIndex < currentButtonsLimit; buttonIndex += 1) {
            if (columnIndex % 2 === 0) {
              range.text(statesObject[buttonIndex].name, () => {});
            } else {
              range.text(statesObject[buttonIndex].name, () => {}).row();
            }
            columnIndex += 1;
          }
          range.text('Next page', (context) => {
            context.menu.update();
            context.chatSession.chatSettings.airRaidAlertSettings.airRaidAlertPageNumber += 1;
          });
        } else if (pageIndex > 1 && pageIndex !== maxPageIndex) {
          for (buttonIndex; buttonIndex < currentButtonsLimit; buttonIndex += 1) {
            if (columnIndex % 2 === 0) {
              range.text(statesObject[buttonIndex].name, () => {});
            } else {
              range.text(statesObject[buttonIndex].name, () => {}).row();
            }
            columnIndex += 1;
          }
          range.text('Next page', (context) => {
            context.menu.update();
            context.chatSession.chatSettings.airRaidAlertSettings.airRaidAlertPageNumber += 1;
          });
          range.text('Previous page', (context) => {
            context.menu.update();
            context.chatSession.chatSettings.airRaidAlertSettings.airRaidAlertPageNumber -= 1;
          });
        } else if (pageIndex === maxPageIndex) {
          const lastPageButtonsLimit = buttonIndex + lastPageButtonsNumber;
          for (buttonIndex; buttonIndex < lastPageButtonsLimit; buttonIndex += 1) {
            if (columnIndex % 2 === 0) {
              range.text(statesObject[buttonIndex].name, () => {});
            } else {
              range.text(statesObject[buttonIndex].name, () => {}).row();
            }
            columnIndex += 1;
          }
          range.text('Previous page', (context) => {
            context.menu.update();
            context.chatSession.chatSettings.airRaidAlertSettings.airRaidAlertPageNumber -= 1;
          });
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
