import { optimizeText } from 'ukrainian-ml-optimizer';

/**
 * @param {string[]} array
 * @param {string[]} whitelist
 * @param {string} split
 * @param {(v: string) => string} additionalMap
 * */
export function getTopUsed(
  array: string[],
  whitelist: string[] = [],
  split = ' ',
  additionalMap: (v: string, index: number, self: string[]) => string = (v) => v,
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

  return [...words.entries()].sort((a, b) => b[1] - a[1]);
}
