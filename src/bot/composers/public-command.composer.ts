import { Composer } from 'grammy';

import { redisService } from '../../services';
import type { GrammyContext } from '../../types';
import { HelpCommand, SettingsCommand, StartCommand } from '../commands';

export interface PublicCommandsComposerProperties {
  startTime: Date;
}

/**
 * @description Public commands that are available for users
 * */
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
