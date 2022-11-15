import { Composer } from 'grammy';

import type { GrammyContext } from '../../../types';
import type { DeleteSwindlersMiddleware } from '../../middleware';
import { ignoreBySettingsMiddleware, nestedMiddleware } from '../../middleware';

export interface SwindlersComposerProperties {
  deleteSwindlersMiddleware: DeleteSwindlersMiddleware;
}

/**
 * @description Remove swindler messages logic
 * */
export const getSwindlersComposer = ({ deleteSwindlersMiddleware }: SwindlersComposerProperties) => {
  const swindlersComposer = new Composer<GrammyContext>();

  swindlersComposer.use(nestedMiddleware(ignoreBySettingsMiddleware('disableSwindlerMessage'), deleteSwindlersMiddleware.middleware()));

  return { swindlersComposer };
};
