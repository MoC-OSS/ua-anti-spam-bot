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

export function execute({ first, second, rate }: RemoveSimilarProperties, callback: (value: RemoveSimilarResult) => any) {
  const result = stringSimilarity.compareTwoStrings(first, second);
  callback({ result, rate, isSame: result > rate });
}
