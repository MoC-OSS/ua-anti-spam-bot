import fs from 'node:fs';
import type { Api, Bot, Context } from 'grammy';

/**
 * Logs internal update to create mock updates.
 * Used for testing.
 * @internal
 * */
export const logUpdates = <C extends Context, A extends Api = Api, B extends Bot<C, A> = Bot<C, A>>(bot: B) => {
  const originUpdate = bot.handleUpdate.bind(bot);
  // eslint-disable-next-line no-param-reassign
  bot.handleUpdate = (update, webhookReplyEnvelope) => {
    const stringifiedUpdate = JSON.stringify(update, null, 2);
    console.info('logUpdates', stringifiedUpdate);
    fs.writeFileSync('./update.json', stringifiedUpdate);

    return originUpdate(update, webhookReplyEnvelope);
  };
};
