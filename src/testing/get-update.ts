import fs from 'node:fs';

import type { Api, Bot, Context } from 'grammy';

import { logger } from '@utils/logger.util';

/**
 * Logs internal update to create mock updates.
 * Used for testing.
 * @param bot - The Grammy bot instance whose updates will be logged.
 * @internal
 */
export const logUpdates = <TContext extends Context, TApi extends Api = Api, TBot extends Bot<TContext, TApi> = Bot<TContext, TApi>>(
  bot: TBot,
) => {
  const originUpdate = bot.handleUpdate.bind(bot);

  // eslint-disable-next-line no-param-reassign
  bot.handleUpdate = (update, webhookReplyEnvelope) => {
    const stringifiedUpdate = JSON.stringify(update, null, 2);

    logger.info({ update: stringifiedUpdate }, 'logUpdates');
    fs.writeFileSync('./update.json', stringifiedUpdate);

    return originUpdate(update, webhookReplyEnvelope);
  };
};
