import stringSimilarity from 'string-similarity';

export interface RemoveSimilarProperties {
  first: string;
  second: string;
  rate: number;
}

export interface RemoveSimilarResult {
  result: number;
  rate: number;
  isSame: boolean;
}

/**
 * Compares two strings for similarity and invokes a callback with the result.
 * @param root0 - The destructured properties object.
 * @param root0.first - The first string to compare.
 * @param root0.second - The second string to compare.
 * @param root0.rate - The similarity threshold rate.
 * @param callback - Function called with the similarity result.
 */
export function execute({ first, second, rate }: RemoveSimilarProperties, callback: (value: RemoveSimilarResult) => void) {
  const result = stringSimilarity.compareTwoStrings(first, second);

  callback({ result, rate, isSame: result > rate });
}
