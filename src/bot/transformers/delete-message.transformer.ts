import type { Transformer } from 'grammy';

import type { GrammyContext } from '@app-types/context';

/**
 * API transformer that sets `context.state.isDeleted = true` whenever `deleteMessage` is called,
 * allowing downstream middleware to know the message was already deleted.
 * @param context - The Grammy context to track deletion state on.
 * @returns A Grammy API transformer function.
 */
export const deleteMessageTransformer =
  (context: GrammyContext): Transformer =>
  (previous, method, payload, signal) => {
    if (method === 'deleteMessage') {
      context.state.isDeleted = true;
    }

    return previous(method, payload, signal);
  };
