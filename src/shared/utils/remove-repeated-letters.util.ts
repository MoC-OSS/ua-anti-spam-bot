/**
 * Removes repeated consecutive letters from a given string.
 * @param message - The input string containing repeated consecutive letters.
 * @returns A new string with repeated consecutive letters removed.
 */
export function removeRepeatedLettersUtility(message: string): string {
  return message.replaceAll(/(.)\1+/g, '$1');
}
