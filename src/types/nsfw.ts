import type { predictionType } from 'nsfwjs';

export interface NsfwTensorNegativeResult {
  isSpam: false;
  predictions: predictionType[] | predictionType[][];
  highestPrediction: predictionType;
}

export interface NsfwTensorPositiveResult {
  isSpam: true;
  predictions: predictionType[] | predictionType[][];
  deletePrediction: predictionType;
  deleteRank: number;
}

export type NsfwTensorResult = NsfwTensorNegativeResult | NsfwTensorPositiveResult;
