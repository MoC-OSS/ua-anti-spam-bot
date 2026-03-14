/**
 * @template T
 * @param {T} smallArray
 * @param {T} bigArray
 *
 * @returns {T}
 * */
export function arrayDiff<T>(bigArray: T[], smallArray: T[]): T[] {
  return bigArray.filter((item) => !smallArray.includes(item));
}

export interface SetOfArraysDiffSmallSet {
  [key: string]: string[];
}

export interface SetOfArraysDiffBigSet {
  [key: string]: string[];
}

export interface SetOfArraysDiffReturn {
  [key: string]: string[];
}

/**
 * @template T
 * @param { [key: string]: string[] } smallSet
 * @param { [key: string]: string[] } bigSet
 *
 * @returns { [key: string]: string[] }
 * */
export function setOfArraysDiff(smallSet: SetOfArraysDiffSmallSet, bigSet: SetOfArraysDiffBigSet): SetOfArraysDiffReturn {
  // eslint-disable-next-line unicorn/no-array-reduce
  return Object.entries(bigSet).reduce((accumulator, [key, value]) => {
    accumulator[key] = arrayDiff(value, smallSet[key]);

    return accumulator;
  }, {});
}
