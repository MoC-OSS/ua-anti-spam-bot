import type { Bot } from 'grammy';
import { Composer } from 'grammy';

import type { DynamicStorageService } from '../../services';
import { ALARM_EVENT_KEY, alarmService } from '../../services';
import { getAlarmMock } from '../../services/_mocks';
import type { TensorService } from '../../tensor';
import type { GrammyContext } from '../../types';
import type { CommandSetter } from '../commands';
import { SessionCommand, StatisticsCommand, SwindlersUpdateCommand } from '../commands';
import { onlyWhitelisted } from '../middleware';

export interface PrivateCommandsComposerProperties {
  bot: Bot<GrammyContext>;
  commandSetter: CommandSetter;
  dynamicStorageService: DynamicStorageService;
  startTime: Date;
  tensorService: TensorService;
}

/**
 * @description Public commands that are available for users
 * */
export const getPrivateCommandsComposer = ({ bot, commandSetter, dynamicStorageService, startTime }: PrivateCommandsComposerProperties) => {
  const privateCommandsComposer = new Composer<GrammyContext>();

  /* Commands */
  const sessionMiddleware = new SessionCommand(startTime);
  const swindlersUpdateMiddleware = new SwindlersUpdateCommand(dynamicStorageService);
  const statisticsMiddleware = new StatisticsCommand(startTime);

  privateCommandsComposer.use(onlyWhitelisted);

  privateCommandsComposer.command('swindlers_update', swindlersUpdateMiddleware.middleware());
  privateCommandsComposer.command('session', sessionMiddleware.middleware());
  privateCommandsComposer.command('statistics', statisticsMiddleware.middleware());

  privateCommandsComposer.command('start_alarm', () => {
    alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(true));
  });

  privateCommandsComposer.command('end_alarm', () => {
    alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(false));
  });

  privateCommandsComposer.command('restart', async (context) => {
    await context.reply('Restarting...');
    await commandSetter.setActive(false);
    await bot.stop();
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(0);
  });

  /* Menu Register */

  return { privateCommandsComposer };
};
