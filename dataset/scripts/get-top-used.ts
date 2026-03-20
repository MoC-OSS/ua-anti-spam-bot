import { optimizeText } from 'ukrainian-ml-optimizer';

/**
 * Counts the top-used tokens in an array by splitting and filtering with optional whitelist/map.
 * @param array - The array of strings to analyze.
 * @param whitelist - Tokens to exclude from the result.
 * @param split - The delimiter used to split each string into tokens.
 * @param additionalMap - Optional additional mapping to apply to tokens.
 * @returns A sorted array of [token, count] pairs.
 */
export function getTopUsed(
  array: string[],
  whitelist: string[] = [],
  split = ' ',
  additionalMap: (v: string, index: number, self: string[]) => string = (value) => value,
) {
  const words: Map<string, number> = new Map();

  array.forEach((item) =>
    optimizeText(item)
      .trim()
      .split(split)
      .map((element, index, self) => additionalMap(element, index, self))
      .filter((word) => optimizeText(word))
      .filter((word) => word.length > 3 && !whitelist.includes(word))
      .forEach((word) => {
        const optimizedWord = optimizeText(word);

        words.set(optimizedWord, (words.get(optimizedWord) || 0) + 1);
      }),
  );

  return [...words.entries()].toSorted((left, right) => right[1] - left[1]);
}
