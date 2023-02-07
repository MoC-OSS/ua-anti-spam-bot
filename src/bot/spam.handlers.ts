import type { GrammyContext } from '../types';

import type { MessageHandler } from './message.handler';

/**
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
