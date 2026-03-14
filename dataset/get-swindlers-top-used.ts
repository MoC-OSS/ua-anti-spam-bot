import fs from 'node:fs';

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

    // eslint-disable-next-line security/detect-object-injection
    result[word] = count;
  });

  sortedTwo.slice(0, 20).forEach((item) => {
    const [word, count] = item;

    // eslint-disable-next-line security/detect-object-injection
    result[word] = count;
  });

  console.info(sorted);
  console.info(sortedTwo);

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.writeFileSync(new URL('strings/swindlers_top_used.json', import.meta.url), JSON.stringify(result, null, 2));
};
