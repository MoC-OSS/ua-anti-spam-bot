/* eslint-disable import/no-extraneous-dependencies */
import Queue from 'queue';
import workerFarm from 'worker-farm';

import { logger } from '@utils/logger.util';

import type { RemoveSimilarResult } from './remove-similar-logic';

const workers = workerFarm(require.resolve('./remove-similar-logic'), ['execute']);

export type RemoveSimilarFinalResult =
  | {
      first: { value: string; label: string };
      second: { value: string; label: string };
      result: number;
      unique: false;
    }
  | { first: { value: string; label: string }; unique: true };

export interface RemoveSimilarFinalResult2First {
  value: string;
  label: string;
}

export interface RemoveSimilarFinalResult2Second {
  value: string;
  label: string;
}

export interface RemoveSimilarFinalResult2 {
  first: RemoveSimilarFinalResult2First;
  second?: RemoveSimilarFinalResult2Second;
  result?: number;
  unique: boolean;
}

interface PrepareArrayArray {
  value: string;
  label: string;
}

interface PrepareArrayReturn {
  value: string;
  label: string;
}

const prepareArray = (array: PrepareArrayArray[] | string[]): PrepareArrayReturn[] =>
  typeof array[0] === 'string'
    ? (array as string[]).filter(Boolean).map((value) => ({ value, label: value }))
    : (array as { value: string; label: string }[]);

export interface RemoveSimilarArray {
  value: string;
  label: string;
}

export const removeSimilar = async (array: RemoveSimilarArray[], compareRate = 0.7) => {
  const filteredArray = prepareArray(array);

  return new Promise<RemoveSimilarFinalResult[][]>((resolve) => {
    const jobQueue = new Queue({ results: [], timeout: 0, concurrency: 6000 });

    filteredArray.forEach((first, firstIndex, self) => {
      jobQueue.push(async (): Promise<RemoveSimilarFinalResult> => {
        if (firstIndex % 100 === 0) {
          logger.info(firstIndex, 'of', filteredArray.length, ((firstIndex / filteredArray.length) * 100).toFixed(2), '%');
        }

        for (const [secondIndex, second] of self.entries()) {
          const compareOptions = {
            first: first.value,
            second: second.value,
            rate: compareRate,
          };

          // eslint-disable-next-line no-await-in-loop, sonarjs/no-nested-functions
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
        jobQueue.start().then(({ error }) => {
          if (error) {
            throw error;
          }

          logger.info({ results: jobQueue.results }, 'all done:');
          workerFarm.end(workers);

          resolve(jobQueue.results as RemoveSimilarFinalResult[][]);
        });
      }
    });
  });
};
