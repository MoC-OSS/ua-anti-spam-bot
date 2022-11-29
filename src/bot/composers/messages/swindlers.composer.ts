import { Composer } from 'grammy';

import type { GrammyContext } from '../../../types';
import type { DeleteSwindlersMiddleware } from '../../middleware';

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
