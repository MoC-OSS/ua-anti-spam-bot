import type { Api, Bot, Context, RawApi } from 'grammy';
import type { AsyncReturnType } from 'type-fest';

import { OutgoingRequests } from './outgoing-requests';

/**
 * Override api responses if needed
 * */
export type ApiResponses = {
  [M in keyof RawApi]?: Partial<AsyncReturnType<RawApi[M]>>;
};

/**
 * Prepares bot for testing.
 * Collects and mocks API requests.
 * Sets default bot info.
 *
 * @example
 * ```ts
 * beforeAll(async () => {
 *   bot = await getBot();
 *   outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
 *     getChat: {},
 *   });
 * }, 15_000);
 * ```
 * */
export const prepareBotForTesting = async <C extends Context, A extends Api = Api, B extends Bot<C, A> = Bot<C, A>>(
  bot: B,
  apiResponses: ApiResponses = {},
) => {
  const outgoingRequests = new OutgoingRequests();

  bot.api.config.use((previous, method, payload, signal) => {
    outgoingRequests.push({ method, payload, signal });

    if (apiResponses[method]) {
      return Promise.resolve({ ok: true, result: apiResponses[method] });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return Promise.resolve({ ok: true, result: true as any });
  });

  // eslint-disable-next-line no-param-reassign
  bot.botInfo = {
    id: 2022,
    first_name: 'GrammyMock Bot',
    is_bot: true,
    username: 'GrammyMock_bot',
    can_join_groups: true,
    can_read_all_group_messages: true,
    supports_inline_queries: false,
  };

  await bot.init();

  return outgoingRequests;
};
