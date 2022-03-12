/* eslint-disable no-param-reassign */
const { CheckboxObjectMenu, KeyboardButton } = require('telegraf-menu');

const { getSettingsMenuMessage, settingsDeleteItemMessage, settingsSubmitMessage } = require('../../message');
const { MenuAction } = require('../actions');

const SETTINGS_FILTERS = [new KeyboardButton(settingsDeleteItemMessage, 'disableDeleteMessage')];

class SettingsMiddleware {
  /**
   * Handle /session
   * Returns session file
   * */
  middleware() {
    /**
     * @param {TelegrafContext} ctx
     * */
    return (ctx) => {
      const settingsMenu = new CheckboxObjectMenu({
        action: MenuAction.SETTINGS,
        message: getSettingsMenuMessage({ ...ctx.session.settings }),
        submitMessage: settingsSubmitMessage,
        replaceable: true,
        filters: SETTINGS_FILTERS,
        state: ctx.session.settings,
        invertedSelection: true,
        formatting: {
          disabled: '⛔️',
        },
        menuGetter: (menuCtx) => menuCtx.session.keyboardMenu,
        menuSetter: (menuCtx, menu) => {
          // eslint-disable-next-line no-param-reassign
          menuCtx.session.keyboardMenu = menu;
        },
        onChange(changeCtx, state) {
          changeCtx.session.keyboardMenu.genericConfig.message = getSettingsMenuMessage(state);
          changeCtx.session.keyboardMenu.config.message = getSettingsMenuMessage(state);
        },
        onSubmit(changeCtx, state) {
          changeCtx.session.settings = state;
          settingsMenu.destroyMenu(changeCtx);
          delete changeCtx.session.keyboardMenu;
        },
      });

      settingsMenu.sendMenu(ctx);
    };
  }
}

module.exports = {
  SettingsMiddleware,
};
