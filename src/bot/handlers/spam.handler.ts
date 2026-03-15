import type { GrammyContext } from '@app-types/context';

import type { MessageHandler } from './message.handler';

/**
 * Checks whether a message is flagged as spam by the tensor-based rule engine.
 *
 * @param {GrammyContext} context
 * @param {MessageHandler} messageHandler
 */
export const isFilteredByRules = async (context: GrammyContext, messageHandler: MessageHandler) => {
  const originMessage = context.state.text;
  const message = messageHandler.sanitizeMessage(context, originMessage || '');
  /**
   * Adapter for tensor
   * */
  const result = await messageHandler.getTensorRank(message, originMessage || '');

  return {
    rule: result.isSpam ? 'tensor' : null,
    dataset: result,
  };
};
