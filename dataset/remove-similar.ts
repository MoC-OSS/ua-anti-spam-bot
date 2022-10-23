/* eslint-disable import/no-extraneous-dependencies */
import queue from 'queue';
import workerFarm from 'worker-farm';

import type { RemoveSimilarResult } from './remove-similar-logic';

// eslint-disable-next-line unicorn/prefer-module
const workers = workerFarm(require.resolve('./remove-similar-logic'), ['execute']);

export type RemoveSimilarFinalResult =
  | {
      first: { value: string; label: string };
      second: { value: string; label: string };
      result: number;
      unique: false;
    }
  | { first: { value: string; label: string }; unique: true };

export interface RemoveSimilarFinalResult2 {
  first: { value: string; label: string };
  second?: { value: string; label: string };
  result?: number;
  unique: boolean;
}

const prepareArray = (array: { value: string; label: string }[] | string[]): { value: string; label: string }[] =>
  typeof array[0] === 'string'
    ? (array as string[]).filter(Boolean).map((value) => ({ value, label: value }))
    : (array as { value: string; label: string }[]);

export const removeSimilar = async (array: { value: string; label: string }[], compareRate = 0.7) => {
  const filteredArray = prepareArray(array);

  return new Promise<RemoveSimilarFinalResult[][]>((resolve) => {
    const q = queue({ results: [], timeout: 0, concurrency: 6000 });

    filteredArray.forEach((first, firstIndex, self) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      q.push(async (): Promise<RemoveSimilarFinalResult> => {
        if (firstIndex % 100 === 0) {
          console.info(firstIndex, 'of', filteredArray.length, ((firstIndex / filteredArray.length) * 100).toFixed(2), '%');
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const [secondIndex, second] of self.entries()) {
          const compareOptions = {
            first: first.value,
            second: second.value,
            rate: compareRate,
          };

          // eslint-disable-next-line no-await-in-loop
          const { isSame, result } = await new Promise<RemoveSimilarResult>((workerResolve) => {
            workers.execute(compareOptions, workerResolve);
          });

          if (isSame) {
            if (secondIndex === firstIndex) {
              return { first, unique: true };
            }
            return {
              first,
              second,
              result,
              unique: false,
            };
          }
        }

        return { first, unique: true };
      });

      if (firstIndex === filteredArray.length - 1) {
        q.start((error) => {
          if (error) throw error;
          console.info('all done:', q.results);
          workerFarm.end(workers);

          resolve(q.results as RemoveSimilarFinalResult[][]);
        });
      }
    });
  });
};
