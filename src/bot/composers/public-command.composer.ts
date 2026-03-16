import { Composer } from 'grammy';

import { HelpCommand } from '@bot/commands/public/help.command';
import { SettingsCommand } from '@bot/commands/public/settings.command';
import { StartCommand } from '@bot/commands/public/start.command';

import { redisService } from '@services/redis.service';

import type { GrammyContext } from '@app-types/context';

/** Properties required to initialize the public commands composer. */
export interface PublicCommandsComposerProperties {
  startTime: Date;
}

/**
 * Composer that registers public bot commands available to all users.
 * @param root0 - Public commands composer properties.
 * @param root0.startTime - The timestamp when the bot process started, used in the help command.
 * @returns An object containing the publicCommandsComposer instance.
 */
export const getPublicCommandsComposer = ({ startTime }: PublicCommandsComposerProperties) => {
  const publicCommandsComposer = new Composer<GrammyContext>();

  /* Commands */
  const startMiddleware = new StartCommand();
  const helpMiddleware = new HelpCommand(startTime);
  const settingsMiddleware = new SettingsCommand(redisService);

  /* Command Register */
  publicCommandsComposer.command('start', startMiddleware.middleware());
  publicCommandsComposer.command(['help', 'status'], helpMiddleware.middleware());
  publicCommandsComposer.command('settings', settingsMiddleware.middleware());

  return { publicCommandsComposer };
};
