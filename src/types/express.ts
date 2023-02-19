import type { DatasetKeys } from '../../dataset/dataset';

import type { SwindlersResult, SwindlerTensorResult } from './swindlers';

/**
 * Process
 * */
export interface ProcessResponseBody {
  result: string | null;
  time: number;
  expressStartTime: string;
}

export interface ProcessRequestBody {
  message: string;
  datasetPath: DatasetKeys;
  strict: boolean;
}

/**
 * Tensor
 * */
export interface TensorResponseBody {
  result: SwindlerTensorResult;
  time: number;
  expressStartTime: string;
}

export interface TensorRequestBody {
  message: string;
  rate: number;
}

/**
 * Swindler
 * */
export interface SwindlerResponseBody {
  result: SwindlersResult;
  time: number;
  expressStartTime: string;
}

export interface SwindlerRequestBody {
  message: string;
}

/**
 * Parse video
 * */
export interface ParseVideoSuccessResponseBody {
  screenshots: ReturnType<Buffer['toJSON']>[];
  time: number;
  expressStartTime: string;
}

export interface ParseVideoErrorResponseBody {
  error: string;
}

export type ParseVideoResponseBody = ParseVideoSuccessResponseBody | ParseVideoErrorResponseBody;

export interface ParseVideoRequestBody {
  duration?: string;
}
