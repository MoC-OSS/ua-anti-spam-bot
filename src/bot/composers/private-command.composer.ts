import type { Bot } from 'grammy';
import { Composer } from 'grammy';

import type { DynamicStorageService } from '../../services';
import { ALARM_EVENT_KEY, alarmService } from '../../services';
import { getAlarmMock } from '../../services/_mocks';
import type { TensorService } from '../../tensor';
import type { GrammyContext } from '../../types';
import type { CommandSetter } from '../commands';
import { SessionCommand, StatisticsCommand, SwindlersUpdateCommand } from '../commands';
import { onlyWhitelistedFilter } from '../filters';

import { getGetVideoNoteConverterComposer } from './video-note-converter.composer';

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

  const { videoNoteConverterComposer } = getGetVideoNoteConverterComposer();

  const composer = privateCommandsComposer.filter((context) => onlyWhitelistedFilter(context));

  const commandMap = new Map<string, string>();
  commandMap.set('swindlers_update', 'Update swindlers database');
  commandMap.set('session', 'Get bot session data');
  commandMap.set('statistics', 'Get bot statistics');
  commandMap.set('start_alarm', 'Start test alarm');
  commandMap.set('end_alarm', 'End test alarm');
  commandMap.set('restart_alarm', 'Restart alarm logic');
  commandMap.set('disable_alarm', 'Disable alarm logic at all');
  commandMap.set('restart', 'Kills the bot process and deletes it');
  commandMap.set('video_note', 'Send a video with /video_note caption to convert it into video note');

  const commandString = [...commandMap.entries()].map(([name, description]) => `/${name} - ${description}`).join('\n');

  /* Commands */
  const sessionMiddleware = new SessionCommand(startTime);
  const swindlersUpdateMiddleware = new SwindlersUpdateCommand(dynamicStorageService);
  const statisticsMiddleware = new StatisticsCommand(startTime);

  composer.command('private', (context) => context.reply(commandString));

  composer.command('swindlers_update', swindlersUpdateMiddleware.middleware());
  composer.command('session', sessionMiddleware.middleware());
  composer.command('statistics', statisticsMiddleware.middleware());

  composer.command('start_alarm', () => {
    alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(true));
  });

  composer.command('end_alarm', () => {
    alarmService.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(false));
  });

  composer.command('restart_alarm', () => {
    alarmService.restart();
  });

  composer.command('disable_alarm', () => {
    alarmService.disable('disable_command');
  });

  composer.command('restart', async (context) => {
    await context.reply('Restarting...');
    await commandSetter.setActive(false);
    await bot.stop();
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(0);
  });

  composer.use(videoNoteConverterComposer);

  /* Menu Register */

  return { privateCommandsComposer };
};
