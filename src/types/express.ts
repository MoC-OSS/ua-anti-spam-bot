import type { SwindlerTensorResult } from './swindlers';

export interface ProcessResponseBody {
  result: string | null;
  time: number;
  expressStartTime: string;
}

export interface ProcessRequestBody {
  message: string;
  datasetPath: string;
  strict: boolean;
}

export interface TensorResponseBody {
  result: SwindlerTensorResult;
  time: number;
  expressStartTime: string;
}

export interface TensorRequestBody {
  message: string;
  rate: number;
}
