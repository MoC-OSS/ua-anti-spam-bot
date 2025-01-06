/**
 * Removes repeated consecutive letters from a given string.
 *
 * @param {string} message - The input string containing repeated consecutive letters.
 * @returns {string} A new string with repeated consecutive letters removed.
 */
export function removeRepeatedLettersUtil(message: string): string {
  return message.replaceAll(/(.)\1+/g, '$1');
}
