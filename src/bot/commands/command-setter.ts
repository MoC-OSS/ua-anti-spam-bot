import type { Bot } from 'grammy';

import type { BotCommand } from 'typegram';

import type { GrammyContext } from '@app-types/context';

import { formatDateIntoAccusative } from '@utils/date-format.util';
import { logger } from '@utils/logger.util';

/**
 * Handles bot public available commands
 * @see https://grammy.dev/guide/commands.html#usage
 */
export class CommandSetter {
  commands: BotCommand[] = [];

  /**
   * Initializes the command setter with bot instance, start time, and active status.
   * @param bot
   * @param startTime
   * @param active
   */
  constructor(
    private bot: Bot<GrammyContext>,
    private startTime: Date,
    private active: boolean,
  ) {}

  /**
   * @description
   * Returns status depending on bot active status
   * @returns
   */
  buildStatus() {
    const activeStatus = this.active ? '🟢 Онлайн' : '🔴 Офлайн';

    return `${activeStatus}, оновлений у ${formatDateIntoAccusative(this.startTime).replace(/GMT\+\d/, '')}`;
  }

  /**
   * Sets the active status and refreshes the bot commands list.
   * @param active
   */
  async setActive(active: boolean) {
    this.active = active;
    await this.updateCommands();
  }

  /**
   * @description
   * Build new commands and set them into the bot
   */
  async updateCommands() {
    /**
     * List of available bot commands with descriptions.
     * @param {BotCommand[]}
     */
    this.commands = [
      { command: 'start', description: '🇺🇦 Почати роботу' },
      { command: 'help', description: '🙋🏻 Отримати допомогу' },
      { command: 'settings', description: '⚙️ Налаштування' },
      { command: 'hotline_security', description: '🚓 Гаряча лінія з цифрової безпеки' },
      { command: 'status', description: this.buildStatus() },
    ];

    try {
      await this.bot.api.setMyCommands(this.commands);
    } catch (error) {
      logger.error({ error }, 'Failed to register bot commands (non-fatal)');
    }
  }
}
