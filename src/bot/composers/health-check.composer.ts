import { Composer } from 'grammy';

import { onlyCreatorFilter } from '@bot/filters/only-creator.filter';
import { ignoreOld } from '@bot/middleware/ignore-old.middleware';

import type { GrammyContext } from '@app-types/context';

/**
 * Composer that provides a command to stress-test the bot process and verify that the health-check restarts it.
 * @returns An object containing the healthCheckComposer instance.
 */
export const getHealthCheckComposer = () => {
  const healthCheckComposer = new Composer<GrammyContext>();

  const composer = healthCheckComposer.filter((context) => onlyCreatorFilter(context));

  composer.command('break', ignoreOld(30), async (context) => {
    await context.reply('Breaking the bot for 1,5 min...\nIt should restart if health-check works.');

    const end = Date.now() + 90_000;

    while (Date.now() < end) {
      // do something here ...
    }

    await context.reply('Bot is still alive. Health-check doesnt work');
  });

  return { healthCheckComposer };
};
