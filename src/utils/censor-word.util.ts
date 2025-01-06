/**
 * Censors a word by replacing characters with asterisks (*) while keeping the first and last characters intact.
 *
 * If the word length is less than or equal to 3, only the last character is preserved and the rest are replaced with asterisks.
 * If the word length is more than 3, both the first and last characters are preserved, while the characters in between are replaced with asterisks.
 *
 * @param {string} word - The word to be censored.
 * @returns {string} The censored word.
 */
export function censorWord(word: string): string {
  if (word.length <= 3) {
    return word.charAt(0) + '*'.repeat(word.length - 1);
  }

  return word.charAt(0) + '*'.repeat(word.length - 2) + word.at(-1);
}
