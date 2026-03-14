import type { Menu } from '@grammyjs/menu';
import { Router } from '@grammyjs/router';
import { Composer } from 'grammy';

import type { CommandSetter } from '@bot/commands/command-setter';
import { RankCommand } from '@bot/commands/private/rank.command';
import { UpdatesCommand } from '@bot/commands/private/updates.command';
import { onlyCreatorFilter } from '@bot/filters/only-creator.filter';

import { redisService } from '@services/redis.service';

import type { TensorService } from '@tensor/tensor.service';

import type { GrammyContext, GrammyMenuContext } from '@app-types/context';

import { featurePollComposer } from './feature-poll.composer';

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

  const composer = creatorCommandsComposer.filter((context) => onlyCreatorFilter(context));

  const commandMap = new Map<string, string>([
    ['updates', 'Global bot updates to all users'],
    ['disable', 'Global disable bot (only deleting strategic info)'],
    ['enable', 'Global enable bot (only deleting strategic info)'],
    ['leave', 'Leave bot from the chat'],
    ['set_rank', 'Get/Set bot strategic rank number'],
    ['set_training_start_rank', 'Get/Set bot strategic training chat rank number'],
    ['set_training_chat_whitelist', 'Get/Set bot training chat ids'],
    ['update_training_chat_whitelist', 'Get/Set bot add new training chat id'],
  ]);

  const commandString = [...commandMap.entries()].map(([name, description]) => `/${name} - ${description}`).join('\n');

  const updatesMiddleware = new UpdatesCommand();

  composer.command('creator', (context) => context.reply(commandString));

  const router = new Router<GrammyContext>((context) => context.session?.step || 'idle');

  /* Command Register */
  router.route('confirmation', updatesMiddleware.confirmation());
  router.route('messageSending', updatesMiddleware.messageSending());

  composer.use(router);
  const rankMiddleware = new RankCommand(tensorService);

  /* Commands */

  composer.command('updates', updatesMiddleware.initialization());

  composer.command('disable', async (context) => {
    await redisService.setIsBotDeactivated(true);
    await commandSetter.setActive(false);
    await commandSetter.updateCommands();

    return context.reply('⛔️ Я виключений глобально');
  });

  composer.command('enable', async (context) => {
    await redisService.setIsBotDeactivated(false);
    await commandSetter.setActive(true);
    await commandSetter.updateCommands();

    return context.reply('✅ Я включений глобально');
  });

  composer.command('leave', (context) => context.leaveChat());

  /* Training and tensor middlewares */
  composer.command('set_rank', rankMiddleware.setRankMiddleware());
  composer.command('set_training_start_rank', rankMiddleware.setTrainingStartRank());
  composer.command('set_training_chat_whitelist', rankMiddleware.setTrainingChatWhitelist());
  composer.command('update_training_chat_whitelist', rankMiddleware.updateTrainingChatWhitelist());

  composer.use(featurePollComposer);

  rootMenu.register(updatesMiddleware.initMenu());

  return { creatorCommandsComposer };
};
