import { Composer } from 'grammy';

import Bottleneck from 'bottleneck';

import { getSuccessfulMessage, getUpdateMessage } from '@message';

import { redisService } from '@services/redis.service';

import type { GrammyContext } from '@app-types/context';
import type { ChatSession } from '@app-types/session';

import { handleError } from '@utils/error-handler.util';

const supportChatId = -1_001_788_350_185;
const pollId = 4080;

/**
 * Sends a feature poll message to selected supergroups using rate-limited bulk sending.
 */
async function bulkSending(context: GrammyContext, sessions: ChatSession[]) {
  return new Promise<void>((resolve) => {
    const limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 3000,
    });

    const message = `<b>Вітання від команди UA Anti Spam Bot! 🇺🇦</b>

Ми плануємо додати новий функціонал, який дозволить блокувати повідомлення, що відносяться до підготовки та проведення контрнаступу. Зайва інформація в мережі тільки шкодить підготовці.

Чи буде такий функціонал корисним для вашого каналу або групи? Ми вкрай зацікавлені у вашій думці, оскільки вона буде важливим фактором у прийнятті рішення щодо старту розробки. Чекаємо ваші відповіді якнайшвидше.

Дякую!`.trim();

    const totalCount = sessions.length;
    const chunkSize = Math.ceil(totalCount / 10);
    let finishedCount = 0;
    let successCount = 0;

    sessions.forEach((chartSession) => {
      limiter
        .schedule(async () => {
          await context.api
            .sendMessage(chartSession.id, message, { parse_mode: 'HTML' })
            // eslint-disable-next-line sonarjs/no-nested-functions
            .then(() => {
              successCount += 1;
            })
            .catch(handleError)
            // eslint-disable-next-line sonarjs/no-nested-functions
            .finally(() => {
              finishedCount += 1;
            });

          await context.api.forwardMessage(+chartSession.id, supportChatId, pollId);
        })
        .catch(handleError);
    });

    limiter.on('done', () => {
      if (finishedCount % chunkSize === 0) {
        context.reply(getUpdateMessage(context, { totalCount, successCount, finishedCount, type: 'feature_poll' })).catch(handleError);
      }
    });

    limiter.on('empty', () => {
      context.reply(getSuccessfulMessage(context, { totalCount, successCount })).catch(handleError);
      resolve();
    });
  });
}

/** Composer that handles the `/feature_poll` command to survey supergroups about new features. */
export const featurePollComposer = new Composer<GrammyContext>();

featurePollComposer.command('feature_poll', async (context) => {
  const allSessions = await redisService.getChatSessions();

  const superGroupsSessions = allSessions
    .filter((session) => session.payload.chatType === 'supergroup' && !session.payload.botRemoved && session.payload.chatMembersCount)
    .filter((session) => +session.id !== supportChatId);

  const sortedSuperGroupsSessions = superGroupsSessions.toSorted(
    (left, right) => right.payload.chatMembersCount - left.payload.chatMembersCount,
  );

  const sessions = sortedSuperGroupsSessions.slice(10, 60);

  await context.reply('Check if has access to the group');
  await context.api.getChat(supportChatId);

  if (sessions.length > 0) {
    await context.reply(`Started feature poll, sessions: ${sessions.length}`);
    await bulkSending(context, sessions);
    await context.reply('Ended feature poll');
  } else {
    await context.reply(`There are no sessions. Total sessions: ${sortedSuperGroupsSessions.length}`);
  }
});
