const { optimizeText } = require('ukrainian-ml-optimizer');

/**
 * @param {string[]} array
 * @param {string[]} whitelist
 * @param {string} split
 * @param {(v: string) => string} additionalMap
 * */
function getTopUsed(array, whitelist = [], split = ' ', additionalMap = (v) => v) {
  const words = new Map();

  array.forEach((item) =>
    optimizeText(item)
      .trim()
      .split(split)
      .map(additionalMap)
      .filter((word) => optimizeText(word))
      .filter((word) => word.length > 3 && !whitelist.includes(word))
      .forEach((word) => {
        const optimizedWord = optimizeText(word);
        words.set(optimizedWord, (words.get(optimizedWord) || 0) + 1);
      }),
  );

  return Array.from(words.entries()).sort((a, b) => b[1] - a[1]);
}

module.exports = {
  getTopUsed,
};
