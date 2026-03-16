/**
 * Returns elements present in `bigArray` but not in `smallArray`.
 * @template T
 * @param smallArray
 * @param bigArray
 * @returns
 */
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
 * Computes per-key array diffs between two record objects.
 * @template T
 * @param smallSet
 * @param bigSet
 * @returns
 */
export function setOfArraysDiff(smallSet: SetOfArraysDiffSmallSet, bigSet: SetOfArraysDiffBigSet): SetOfArraysDiffReturn {
  // eslint-disable-next-line unicorn/no-array-reduce
  return Object.entries(bigSet).reduce((accumulator, [key, value]) => {
    // eslint-disable-next-line security/detect-object-injection
    accumulator[key] = arrayDiff(value, smallSet[key]);

    return accumulator;
  }, {});
}
