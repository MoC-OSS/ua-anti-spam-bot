import { Composer } from 'grammy';

import type { DeleteSwindlersMiddleware } from '@bot/middleware/delete-swindlers.middleware';

import type { GrammyContext } from '@app-types/context';

/** Properties for the swindler message detection composer. */
export interface SwindlersComposerProperties {
  deleteSwindlersMiddleware: DeleteSwindlersMiddleware;
}

/**
 * Returns a composer that detects and deletes messages from swindlers and scammers.
 * @param root0 - Composer properties.
 * @param root0.deleteSwindlersMiddleware - Middleware that handles swindler message detection and deletion.
 * @returns Object containing the swindlers composer instance.
 */
export const getSwindlersComposer = ({ deleteSwindlersMiddleware }: SwindlersComposerProperties) => {
  const swindlersComposer = new Composer<GrammyContext>();

  swindlersComposer.use(deleteSwindlersMiddleware.middleware());

  return { swindlersComposer };
};
