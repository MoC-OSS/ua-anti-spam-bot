import { logsStartMessages } from '../message';

/**
 * Removes system information from a given message.
 * If the message contains any of the predefined log start messages,
 * the system information portion of the message is removed.
 *
 * @param {string} message - The input message to process.
 * @returns {string} The modified message with system information removed,
 * or the original message if no system information is found.
 */
export const removeSystemInformationUtil = (message: string): string => {
  const hasLog = [...logsStartMessages.keys()].some((logStartMessage) => message.startsWith(logStartMessage));

  return hasLog ? message.split('\n').slice(3).join('\n') : message;
};
