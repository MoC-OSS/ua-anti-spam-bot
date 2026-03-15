import { Composer } from 'grammy';

import type { DeleteSwindlersMiddleware } from '@bot/middleware/delete-swindlers.middleware';

import type { GrammyContext } from '@app-types/context';

/** Properties for the swindler message detection composer. */
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
