import type { Transformer } from 'grammy';

import type { GrammyContext } from '../../types';

export const deleteMessageTransformer =
  (context: GrammyContext): Transformer =>
  (previous, method, payload, signal) => {
    if (method === 'deleteMessage') {
      context.state.isDeleted = true;
    }

    return previous(method, payload, signal);
  };
