const { joinMessage, handleError, formatDate } = require('../../utils');

class HelpMiddleware {
  /**
   * @param {Date} startTime
   * */
  constructor(startTime) {
    this.startTime = startTime;
  }

  /**
   * Handle /help
   * Returns help message
   * */
  middleware() {
    /**
     * @param {TelegrafContext} ctx
     * */
    return (ctx) => {
      const startLocaleTime = formatDate(this.startTime);

      ctx
        .reply(
          joinMessage([
            '<b>Якщо повідомлення було видалено помилково:</b>',
            '',
            '• Попросіть адміністраторів написати його самостійно;',
            '• Пришліть його скріншотом.',
            '',
            '<b>Останнє оновлення боту:</b>',
            '',
            startLocaleTime,
            '',
            'Якщо є запитання, пишіть @dimkasmile',
          ]),
          {
            parse_mode: 'HTML',
          },
        )
        .catch(handleError);
    };
  }
}

module.exports = {
  HelpMiddleware,
};
