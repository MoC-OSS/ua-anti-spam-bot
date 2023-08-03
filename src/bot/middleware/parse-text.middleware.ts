import type { Message } from '@grammyjs/types';
import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

/**
 * Gets the text content from a given message.
 *
 * @param {Message | undefined} message - The message object from which to extract the text content.
 * @returns {string | undefined} The text content of the message if available, or undefined if the message is falsy or doesn't have any text content.
 */
const getTextFromMessage = (message: Message | undefined) => message && (message.text || message.caption || message.poll?.question);

/**
 * @description
 * Add text into state
 * */
export function parseText(context: GrammyContext, next: NextFunction) {
  const text = getTextFromMessage(context.msg) || getTextFromMessage(context.editedMessage);

  if (text) {
    context.state.text = text;
  }

  return next();
}
