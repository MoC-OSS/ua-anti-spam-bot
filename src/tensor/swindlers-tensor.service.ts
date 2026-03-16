/**
 * @module swindlers-tensor.service
 * @description TensorFlow-based ML classifier for detecting swindler messages.
 * Extends {@link BaseTensorService} with the swindlers-specific model files.
 */

import { environmentConfig } from '@shared/config';

import { logger } from '@utils/logger.util';

import { BaseTensorService } from './base-tensor.service';

export class SwindlersTensorService extends BaseTensorService {
  constructor(modelPath: string, spamThreshold: number) {
    super(modelPath, spamThreshold);
    this.loadModelMetadata('./swindlers-temp/model.json', './swindlers-temp/vocab.json');
  }
}

/**
 * Creates and initializes a {@link SwindlersTensorService} instance with model loaded.
 */
export const initSwindlersTensor = async () => {
  const tensorService = new SwindlersTensorService('./swindlers-temp/model.json', environmentConfig.TENSOR_RANK);

  logger.info('Loading swindlers tensor model...');
  const start = Date.now();

  await tensorService.loadModel();
  logger.info(`Swindlers tensor model loaded in ${((Date.now() - start) / 1000).toFixed(2)}s.`);

  return tensorService;
};
