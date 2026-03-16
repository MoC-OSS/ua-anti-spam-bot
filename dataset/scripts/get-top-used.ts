import { optimizeText } from 'ukrainian-ml-optimizer';

/**
 * @param array
 * @param whitelist
 * @param split
 * @param additionalMap
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
