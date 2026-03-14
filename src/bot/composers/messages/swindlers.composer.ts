import { Composer } from 'grammy';

import type { DeleteSwindlersMiddleware } from '@bot/middleware';

import type { GrammyContext } from '@types/';

export interface SwindlersComposerProperties {
  deleteSwindlersMiddleware: DeleteSwindlersMiddleware;
}

/**
 * @description Remove swindler messages logic
 * */
export const getSwindlersComposer = ({ deleteSwindlersMiddleware }: SwindlersComposerProperties) => {
  const swindlersComposer = new Composer<GrammyContext>();

  swindlersComposer.use(deleteSwindlersMiddleware.middleware());

  return { swindlersComposer };
};
