const { formatDate } = require('../../utils');

class CommandSetter {
  /**
   * @param {Bot} bot
   * @param {Date} startTime
   * @param {boolean} active
   * */
  constructor(bot, startTime, active) {
    this.bot = bot;
    this.startTime = startTime;
    this.active = active;
    this.updateCommands();
  }

  buildStatus() {
    const activeStatus = this.active ? '🟢 Онлайн' : '🔴 Офлайн';
    return `${activeStatus}, оновлений у ${formatDate(this.startTime).replace(/GMT\+\d/, '')}`;
  }

  /**
   * @param {boolean} active
   */
  setActive(active) {
    this.active = active;
    this.updateCommands();
  }

  updateCommands() {
    /**
     * @param {BotCommand[]}
     * */
    this.commands = [
      { command: 'start', description: '🇺🇦 Почати роботу' },
      { command: 'help', description: '🙋🏻 Отримати допомогу' },
      { command: 'status', description: this.buildStatus() },
    ];

    return this.bot.api.setMyCommands(this.commands);
  }
}

module.exports = {
  CommandSetter,
};
