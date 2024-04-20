import type { Api, Bot, Context, RawApi } from 'grammy';
import type { AsyncReturnType } from 'type-fest';

import { OutgoingRequests } from './outgoing-requests';
import { NewMemberMockUpdate } from './updates';

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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-explicit-any
    return Promise.resolve({ ok: true, result: true as any });
  });

  const genericUpdate = new NewMemberMockUpdate();

  // eslint-disable-next-line no-param-reassign
  bot.botInfo = {
    ...genericUpdate.genericUserBot,
    can_join_groups: true,
    can_read_all_group_messages: true,
    supports_inline_queries: false,
  };

  await bot.init();

  return outgoingRequests;
};
