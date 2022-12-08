import type { Bot } from 'grammy';
import type { BotCommand } from 'typegram';

import type { GrammyContext } from '../../types';
import { formatDateIntoAccusative } from '../../utils';

/**
 * Handles bot public available commands
 * @see https://grammy.dev/guide/commands.html#usage
 * */
export class CommandSetter {
  commands: BotCommand[] = [];

  /**
   * @param {Bot} bot
   * @param {Date} startTime
   * @param {boolean} active
   * */
  constructor(private bot: Bot<GrammyContext>, private startTime: Date, private active: boolean) {}

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
  async setActive(active: boolean) {
    this.active = active;
    await this.updateCommands();
  }

  /**
   * @description
   * Build new commands and set them into the bot
   * */
  async updateCommands() {
    /**
     * @param {BotCommand[]}
     * */
    this.commands = [
      { command: 'start', description: '🇺🇦 Почати роботу' },
      { command: 'help', description: '🙋🏻 Отримати допомогу' },
      { command: 'settings', description: '⚙️ Налаштування' },
      { command: 'status', description: this.buildStatus() },
    ];

    await this.bot.api.setMyCommands(this.commands);
  }
}
