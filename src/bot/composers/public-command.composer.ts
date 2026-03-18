import { Composer } from 'grammy';

import { HelpCommand } from '@bot/commands/public/help.command';
import { LanguageCommand } from '@bot/commands/public/language.command';
import { RoleCommand } from '@bot/commands/public/role.command';
import { SettingsCommand } from '@bot/commands/public/settings.command';
import { StartCommand } from '@bot/commands/public/start.command';

import { redisService } from '@services/redis.service';

import type { GrammyCommandMiddleware, GrammyContext } from '@app-types/context';

/** Properties required to initialize the public commands composer. */
export interface PublicCommandsComposerProperties {
  startTime: Date;
}

/**
 * Deletes the handled public command message and stores the result on request state.
 * @param context - Grammy command context.
 * @param next - Next middleware in the command chain.
 * @returns A promise that resolves after the remaining middleware finishes.
 */
const deleteHandledCommandMessage: GrammyCommandMiddleware = async (context, next) => {
  context.state.isCommandMessageDeleted = await context
    .deleteMessage()
    .then(() => true)
    .catch(() => false);

  return next();
};

/**
 * Composer that registers public bot commands available to all users.
 * @param root0 - Public commands composer properties.
 * @param root0.startTime - The timestamp when the bot process started, used in the help command.
 * @returns An object containing the publicCommandsComposer instance.
 */
export const getPublicCommandsComposer = ({ startTime }: PublicCommandsComposerProperties) => {
  const publicCommandsComposer = new Composer<GrammyContext>();

  const registerPublicCommand = (names: Parameters<typeof publicCommandsComposer.command>[0], middleware: GrammyCommandMiddleware) => {
    publicCommandsComposer.command(names, deleteHandledCommandMessage, middleware);
  };

  /* Commands */
  const startMiddleware = new StartCommand();
  const helpMiddleware = new HelpCommand(startTime);
  const settingsMiddleware = new SettingsCommand(redisService);
  const languageMiddleware = new LanguageCommand();
  const roleMiddleware = new RoleCommand();

  /* Command Register */
  registerPublicCommand('start', startMiddleware.middleware());
  registerPublicCommand(['help', 'status'], helpMiddleware.middleware());
  registerPublicCommand('settings', settingsMiddleware.middleware());
  registerPublicCommand('language', languageMiddleware.middleware());
  registerPublicCommand('role', roleMiddleware.middleware());

  return { publicCommandsComposer };
};
