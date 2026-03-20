import type { PredictionType } from 'nsfwjs';

export interface NsfwTensorNegativeResult {
  isSpam: false;
  predictions: PredictionType[] | PredictionType[][];
  highestPrediction: PredictionType;
}

export interface NsfwTensorPositiveResult {
  isSpam: true;
  predictions: PredictionType[] | PredictionType[][];
  deletePrediction: PredictionType;
  deleteRank: number;
}

export type NsfwTensorResult = NsfwTensorNegativeResult | NsfwTensorPositiveResult;
