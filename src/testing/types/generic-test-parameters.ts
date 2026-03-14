import type { Api, Bot, Context } from 'grammy';

import type { OutgoingRequests } from '@testing/outgoing-requests';

/**
 * Reusing existing tests
 * */
export interface GenericTestParameters<
  TContext extends Context = Context,
  TApi extends Api = Api,
  TBot extends Bot<TContext, TApi> = Bot<TContext, TApi>,
> {
  bot: TBot;
  outgoingRequests: OutgoingRequests;
}
