import type { Message } from '@grammyjs/types';
import type { NextFunction } from 'grammy';

import type { GrammyContext } from '@app-types/context';

/**
 * Gets the text content from a given message.
 * @param message - The message object from which to extract the text content.
 * @returns The text content of the message if available, or undefined if the message is falsy or doesn't have any text content.
 */
const getTextFromMessage = (message: Message | undefined) => message && (message.text || message.caption || message.poll?.question);

/**
 * Add text into state
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export function parseText(context: GrammyContext, next: NextFunction) {
  const text = getTextFromMessage(context.msg) || getTextFromMessage(context.editedMessage);

  if (text) {
    context.state.text = text;
  }

  return next();
}
