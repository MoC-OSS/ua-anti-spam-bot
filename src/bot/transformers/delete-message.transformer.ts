import type { Transformer } from 'grammy';

import type { GrammyContext } from '@app-types/context';

/**
 * API transformer that sets `context.state.isDeleted = true` after `deleteMessage`
 * succeeds, allowing downstream middleware to know the message was actually deleted.
 * @param context - The Grammy context to track deletion state on.
 * @returns A Grammy API transformer function.
 */
export const deleteMessageTransformer =
  (context: GrammyContext): Transformer =>
  (previous, method, payload, signal) => {
    if (method === 'deleteMessage') {
      return previous(method, payload, signal).then((result) => {
        context.state.isDeleted = true;

        return result;
      });
    }

    return previous(method, payload, signal);
  };
