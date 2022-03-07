const { joinMessage, handleError } = require('../../utils');

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
      const startLocaleTime = this.startTime.toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

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
