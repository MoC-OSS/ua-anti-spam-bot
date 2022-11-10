import { Composer } from 'grammy';

import type { GrammyContext } from '../../types';
import { onlyCreatorFilter } from '../filters';

/**
 * @description Health-check helper composer
 * */
export const getHealthCheckComposer = () => {
  const healthCheckComposer = new Composer<GrammyContext>();

  const composer = healthCheckComposer.filter((context) => onlyCreatorFilter(context));

  composer.command('break', async (context) => {
    await context.reply('Breaking the bot for 1 min...\nIt should restart if health-check works.');

    const end = Date.now() + 60_000;
    while (Date.now() < end) {
      // do something here ...
    }

    await context.reply('Bot is still alive. Health-check doesnt work');
  });

  return { healthCheckComposer };
};
