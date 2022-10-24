import type { Menu } from '@grammyjs/menu';
import type { Bot } from 'grammy';
import { Composer } from 'grammy';

import { settingsAvailableMessage } from '../../message';
import type { GrammyContext, GrammyMenuContext, State } from '../../types';
import { HelpCommand, SettingsCommand, StartCommand } from '../commands';
import { deleteMessageMiddleware, nestedMiddleware, onlyAdmin } from '../middleware';

export interface PublicCommandsComposerProperties {
  bot: Bot<GrammyContext>;
  rootMenu: Menu<GrammyMenuContext>;
  startTime: Date;
  states: State[];
}

/**
 * @description Public commands that are available for users
 * */
export const getPublicCommandsComposer = ({ bot, startTime, states, rootMenu }: PublicCommandsComposerProperties) => {
  const publicCommandsComposer = new Composer<GrammyContext>();

  /* Commands */
  const startMiddleware = new StartCommand(bot);
  const helpMiddleware = new HelpCommand(startTime);
  const settingsMiddleware = new SettingsCommand(states);

  /* Command Register */
  publicCommandsComposer.command('start', startMiddleware.middleware());
  publicCommandsComposer.command(['help', 'status'], helpMiddleware.middleware());
  publicCommandsComposer.command(
    'settings',
    deleteMessageMiddleware,
    onlyAdmin,
    nestedMiddleware((context, next) => {
      if (context.chat?.type !== 'private') {
        return next();
      }
    }, settingsMiddleware.sendSettingsMenu()),
    (context, next) => {
      if (context.chat.type === 'private') {
        return context.reply(settingsAvailableMessage);
      }

      return next();
    },
  );

  /* Menu Register */
  rootMenu.register(settingsMiddleware.initMenu());
  rootMenu.register(settingsMiddleware.initDescriptionSubmenu(), 'settingsMenu');
  rootMenu.register(settingsMiddleware.initAirRaidAlertSubmenu(), 'settingsMenu');

  return { publicCommandsComposer };
};
