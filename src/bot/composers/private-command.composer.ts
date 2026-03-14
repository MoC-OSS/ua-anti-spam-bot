import type { Bot } from 'grammy';
import { Composer } from 'grammy';

import type { CommandSetter } from '@bot/commands';
import { SessionCommand, StatisticsCommand, SwindlersUpdateCommand } from '@bot/commands';
import { onlyWhitelistedFilter } from '@bot/filters';

import type { DynamicStorageService } from '@services/';
import { ALARM_EVENT_KEY, alarmService } from '@services/';
import { getAlarmMock } from '@services/_mocks';

import type { TensorService } from '@tensor/';

import type { GrammyContext } from '@types/';

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

  const commandMap = new Map<string, string>([
    ['swindlers_update', 'Update swindlers database'],
    ['session', 'Get bot session data'],
    ['statistics', 'Get bot statistics'],
    ['start_alarm', 'Start test alarm'],
    ['end_alarm', 'End test alarm'],
   ['restart_alarm', 'Restart alarm logic']]);

  commandMap.set('disable_alarm', 'Disable alarm logic at all');
  commandMap.set('restart', 'Kills the bot process and deletes it');
  commandMap.set('video_note', 'Send a video with /video_note caption to convert it into video note');

  const commandString = [...commandMap.entries()].map(([name, description]) => `/${name} - ${description}`).join('\n');

  /* Commands */
  const sessionMiddleware = new SessionCommand(startTime);
  const swindlersUpdateMiddleware = new SwindlersUpdateCommand(dynamicStorageService);
  const statisticsMiddleware = new StatisticsCommand();

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

  composer.command('thread', async (context) => {
    const message = await context.replyWithHTML(
      `Message Thread Id:\n<code>${context.msg?.message_thread_id?.toString()}</code>` || 'No thread id',
    );

    await context.pinChatMessage(message.message_id);
  });

  composer.use(videoNoteConverterComposer);

  /* Menu Register */

  return { privateCommandsComposer };
};
