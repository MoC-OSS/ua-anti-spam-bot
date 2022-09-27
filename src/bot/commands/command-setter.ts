import { BotCommand } from 'typegram';
import { Bot } from 'grammy';

import { formatDateIntoAccusative } from '../../utils';

/**
 * Handles bot public available commands
 * @see https://grammy.dev/guide/commands.html#usage
 * */
class CommandSetter {
  /**
   * @param {Bot} bot
   * @param {Date} startTime
   * @param {boolean} active
   * */
  bot: Bot;
  startTime: Date;
  active: boolean;
  commands: BotCommand[] = [];
  constructor(bot, startTime, active) {
    this.bot = bot;
    this.startTime = startTime;
    this.active = active;
    this.updateCommands();
  }

  /**
   * @description
   * Returns status depending on bot active status
   *
   * @returns {string}
   * */
  buildStatus() {
    const activeStatus = this.active ? '🟢 Онлайн' : '🔴 Офлайн';
    return `${activeStatus}, оновлений у ${formatDateIntoAccusative(this.startTime).replace(/GMT\+\d/, '')}`;
  }

  /**
   * @param {boolean} active
   */
  setActive(active) {
    this.active = active;
    this.updateCommands();
  }

  /**
   * @description
   * Build new commands and set them into the bot
   * */
  updateCommands() {
    /**
     * @param {BotCommand[]}
     * */
    this.commands = [
      { command: 'start', description: '🇺🇦 Почати роботу' },
      { command: 'help', description: '🙋🏻 Отримати допомогу' },
      { command: 'settings', description: '⚙️ Налаштування' },
      { command: 'status', description: this.buildStatus() },
    ];

    return this.bot.api.setMyCommands(this.commands);
  }
}

module.exports = {
  CommandSetter,
};
