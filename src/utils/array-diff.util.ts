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

/**
 * @template T
 * @param { [key: string]: string[] } smallSet
 * @param { [key: string]: string[] } bigSet
 *
 * @returns { [key: string]: string[] }
 * */
export function setOfArraysDiff(smallSet: { [key: string]: string[] }, bigSet: { [key: string]: string[] }): { [key: string]: string[] } {
  // eslint-disable-next-line unicorn/no-array-reduce
  return Object.entries(bigSet).reduce((accumulator, [key, value]) => {
    accumulator[key] = arrayDiff(value, smallSet[key]);
    return accumulator;
  }, {});
}
