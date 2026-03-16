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
 *
 * @param root0
 * @param root0.first
 * @param root0.second
 * @param root0.rate
 * @param callback
 */
export function execute({ first, second, rate }: RemoveSimilarProperties, callback: (value: RemoveSimilarResult) => void) {
  const result = stringSimilarity.compareTwoStrings(first, second);

  callback({ result, rate, isSame: result > rate });
}
