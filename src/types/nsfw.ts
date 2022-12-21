import type { predictionType } from 'nsfwjs';

export interface NsfwTensorNegativeResult {
  isSpam: false;
  predictions: predictionType[];
  highestPrediction: predictionType;
}

export interface NsfwTensorPositiveResult {
  isSpam: true;
  predictions: predictionType[];
  deletePrediction: predictionType;
  deleteRank: number;
}

export type NsfwTensorResult = NsfwTensorNegativeResult | NsfwTensorPositiveResult;
