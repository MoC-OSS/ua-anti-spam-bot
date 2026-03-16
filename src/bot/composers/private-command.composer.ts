import type { Bot } from 'grammy';
import { Composer } from 'grammy';

import type { CommandSetter } from '@bot/commands/command-setter';
import { SessionCommand } from '@bot/commands/private/session.command';
import { StatisticsCommand } from '@bot/commands/private/statistics.command';
import { SwindlersUpdateCommand } from '@bot/commands/private/swindlers-update.command';
import { onlyWhitelistedFilter } from '@bot/filters/only-whitelisted.filter';

import { getAlarmMock } from '@services/_mocks/alarm.mocks';
import { ALARM_EVENT_KEY, alarmService } from '@services/alarm.service';
import type { DynamicStorageService } from '@services/dynamic-storage.service';

import type { TensorService } from '@tensor/tensor.service';

import type { GrammyContext } from '@app-types/context';

import { getGetVideoNoteConverterComposer } from './video-note-converter.composer';

/** Properties required to initialize the private (whitelisted) commands composer. */
export interface PrivateCommandsComposerProperties {
  bot: Bot<GrammyContext>;
  commandSetter: CommandSetter;
  dynamicStorageService: DynamicStorageService;
  startTime: Date;
  tensorService: TensorService;
}

/**
 * Composer that registers bot commands available to whitelisted (private) users.
 * @param root0 - Private commands composer properties.
 * @param root0.bot - The Grammy bot instance used to trigger restarts.
 * @param root0.commandSetter - Service used to register bot commands with Telegram.
 * @param root0.dynamicStorageService - Service for managing dynamically-updated bot data.
 * @param root0.startTime - The timestamp when the bot process started.
 * @returns An object containing the privateCommandsComposer instance.
 */
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
    ['restart_alarm', 'Restart alarm logic'],
    ['disable_alarm', 'Disable alarm logic at all'],
    ['restart', 'Kills the bot process and deletes it'],
    ['video_note', 'Send a video with /video_note caption to convert it into video note'],
  ]);

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
    const threadId = context.msg?.message_thread_id?.toString();
    const message = await context.reply(threadId ? `Message Thread Id:\n<code>${threadId}</code>` : 'No thread id', { parse_mode: 'HTML' });

    await context.pinChatMessage(message.message_id);
  });

  composer.use(videoNoteConverterComposer);

  /* Menu Register */

  return { privateCommandsComposer };
};
