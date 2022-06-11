const fs = require('fs');
const path = require('path');

const { optimizeText } = require('ukrainian-ml-optimizer');

const swindlers = require('./strings/swindlers.json');

const words = new Map();
const twoWords = new Map();

const whitelist = ['україн'];

swindlers.forEach((item) =>
  optimizeText(item)
    .trim()
    .split(' ')
    .filter((word) => optimizeText(word))
    .filter((word) => word.length > 3 && !whitelist.includes(word))
    .forEach((word) => {
      const optimizedWord = optimizeText(word);
      words.set(optimizedWord, (words.get(optimizedWord) || 0) + 1);
    }),
);

swindlers.forEach((item) =>
  optimizeText(item)
    .trim()
    .split(' ')
    .map((item2, index, self) => {
      if (index === swindlers.length - 1) {
        return item2;
      }

      return `${item2} ${self[index + 1]}`;
    })
    .filter((word) => optimizeText(word))
    .filter((word) => word.length > 3 && !whitelist.includes(word))
    .forEach((word) => {
      const optimizedWord = optimizeText(word);
      twoWords.set(optimizedWord, (twoWords.get(optimizedWord) || 0) + 1);
    }),
);

const sorted = Array.from(words.entries()).sort((a, b) => b[1] - a[1]);
const sortedTwo = Array.from(twoWords.entries()).sort((a, b) => b[1] - a[1]);
const result = {};
sorted.slice(0, 20).forEach((item) => {
  const [word, count] = item;
  result[word] = count;
});

sortedTwo.slice(0, 20).forEach((item) => {
  const [word, count] = item;
  result[word] = count;
});

console.info(sorted);
console.info(sortedTwo);

fs.writeFileSync(path.join(__dirname, './strings/swindlers_top_used.json'), JSON.stringify(result, null, 2));
