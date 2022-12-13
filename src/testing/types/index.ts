import type { Api, Bot, Context } from 'grammy';

import type { OutgoingRequests } from '../outgoing-requests';

/**
 * Reusing existing tests
 * */
export interface GenericTestParameters<C extends Context = Context, A extends Api = Api, B extends Bot<C, A> = Bot<C, A>> {
  bot: B;
  outgoingRequests: OutgoingRequests;
}
