import type { Menu } from '@grammyjs/menu';
import { Router } from '@grammyjs/router';
import { Composer } from 'grammy';

import { redisService } from '../../services';
import type { TensorService } from '../../tensor';
import type { GrammyContext, GrammyMenuContext } from '../../types';
import type { CommandSetter } from '../commands';
import { RankCommand, UpdatesCommand } from '../commands';
import { onlyCreator } from '../middleware';

export interface CreatorCommandsComposerProperties {
  commandSetter: CommandSetter;
  rootMenu: Menu<GrammyMenuContext>;
  tensorService: TensorService;
}

/**
 * @description Public commands that are available for users
 * */
export const getCreatorCommandsComposer = ({ commandSetter, rootMenu, tensorService }: CreatorCommandsComposerProperties) => {
  const creatorCommandsComposer = new Composer<GrammyContext>();

  const commandMap = new Map<string, string>();
  commandMap.set('updates', 'Global bot updates to all users');
  commandMap.set('disable', 'Global disable bot (only deleting strategic info)');
  commandMap.set('enable', 'Global enable bot (only deleting strategic info)');
  commandMap.set('leave', 'Leave bot from the chat');
  commandMap.set('set_rank', 'Get/Set bot strategic rank number');
  commandMap.set('set_training_start_rank', 'Get/Set bot strategic training chat rank number');
  commandMap.set('set_training_chat_whitelist', 'Get/Set bot training chat ids');
  commandMap.set('update_training_chat_whitelist', 'Get/Set bot add new training chat id');

  const commandString = [...commandMap.entries()].map(([name, description]) => `/${name} - ${description}`).join('\n');

  const updatesMiddleware = new UpdatesCommand();

  creatorCommandsComposer.use(onlyCreator);

  creatorCommandsComposer.command('creator', (context) => context.reply(commandString));

  const router = new Router<GrammyContext>((context) => context.session?.step || 'idle');

  /* Command Register */
  router.route('confirmation', updatesMiddleware.confirmation());
  router.route('messageSending', updatesMiddleware.messageSending());

  creatorCommandsComposer.use(router);
  const rankMiddleware = new RankCommand(tensorService);

  /* Commands */

  creatorCommandsComposer.command('updates', updatesMiddleware.initialization());

  creatorCommandsComposer.command('disable', async (context) => {
    await redisService.setIsBotDeactivated(true);
    await commandSetter.setActive(false);
    await commandSetter.updateCommands();
    return context.reply('⛔️ Я виключений глобально');
  });

  creatorCommandsComposer.command('enable', async (context) => {
    await redisService.setIsBotDeactivated(false);
    await commandSetter.setActive(true);
    await commandSetter.updateCommands();
    return context.reply('✅ Я включений глобально');
  });

  creatorCommandsComposer.command('leave', (context) => context.leaveChat());

  /* Training and tensor middlewares */
  creatorCommandsComposer.command('set_rank', rankMiddleware.setRankMiddleware());
  creatorCommandsComposer.command('set_training_start_rank', rankMiddleware.setTrainingStartRank());
  creatorCommandsComposer.command('set_training_chat_whitelist', rankMiddleware.setTrainingChatWhitelist());
  creatorCommandsComposer.command('update_training_chat_whitelist', rankMiddleware.updateTrainingChatWhitelist());

  rootMenu.register(updatesMiddleware.initMenu());

  return { creatorCommandsComposer };
};
