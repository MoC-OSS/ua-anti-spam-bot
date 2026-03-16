import type { Api, Bot, Context, RawApi } from 'grammy';

import type { AsyncReturnType } from 'type-fest';

import { NewMemberMockUpdate } from './updates/new-member-mock.update';
import { OutgoingRequests } from './outgoing-requests';

/**
 * Override api responses if needed
 */
export type ApiResponses = {
  [M in keyof RawApi]?: Partial<AsyncReturnType<RawApi[M]>>;
};

/**
 * Prepares bot for testing.
 * Collects and mocks API requests.
 * Sets default bot info.
 * @param bot
 * @param apiResponses
 * @example
 * ```ts
 * beforeAll(async () => {
 *   bot = await getBot();
 *   outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
 *     getChat: {},
 *   });
 * }, 15_000);
 * ```
 */
export const prepareBotForTesting = async <
  TContext extends Context,
  TApi extends Api = Api,
  TBot extends Bot<TContext, TApi> = Bot<TContext, TApi>,
>(
  bot: TBot,
  apiResponses: ApiResponses = {},
) => {
  const outgoingRequests = new OutgoingRequests();

  bot.api.config.use((previous, method, payload, signal) => {
    outgoingRequests.push({ method, payload, signal });

    // eslint-disable-next-line security/detect-object-injection
    if (apiResponses[method]) {
      // eslint-disable-next-line security/detect-object-injection
      return Promise.resolve({ ok: true, result: apiResponses[method] });
    }

    return Promise.resolve({ ok: true, result: true as any });
  });

  const genericUpdate = new NewMemberMockUpdate();

  // eslint-disable-next-line no-param-reassign
  bot.botInfo = {
    ...genericUpdate.genericUserBot,
    can_join_groups: true,
    can_read_all_group_messages: true,
    supports_inline_queries: false,
    can_connect_to_business: false,
    has_main_web_app: false,
    has_topics_enabled: false,
    allows_users_to_create_topics: false,
  };

  await bot.init();

  return outgoingRequests;
};
