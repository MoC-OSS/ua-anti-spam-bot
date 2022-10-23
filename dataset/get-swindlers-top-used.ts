/* eslint-disable unicorn/prefer-module */
import fs from 'node:fs';
import path from 'node:path';

import { getTopUsed } from './get-top-used';

/**
 * @param {string[]} dataset
 * */
export const getSwindlersTopUsed = (dataset: string[]) => {
  const whitelist = ['україн'];
  const sorted = getTopUsed(dataset, whitelist, ' ');
  const sortedTwo = getTopUsed(dataset, whitelist, ' ', (item2, index, self) => {
    if (index === dataset.length - 1) {
      return item2;
    }

    return `${item2} ${self[index + 1]}`;
  });

  const result = {};
  sorted.slice(0, 9).forEach((item) => {
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
};
