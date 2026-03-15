/**
 * @module tensor.service
 * @description General-purpose spam tensor classification service.
 * Extends {@link BaseTensorService} with the default model files.
 */

import type { S3Service } from '@services/s3.service';

import { logger } from '@utils/logger.util';

import { environmentConfig } from '../config';

import { BaseTensorService } from './base-tensor.service';

export class TensorService extends BaseTensorService {
  constructor(modelPath: string, spamThreshold: number) {
    super(modelPath, spamThreshold);
    this.loadModelMetadata('./temp/model.json', './temp/vocab.json');
  }
}

/**
 * Creates and initializes a {@link TensorService}, optionally downloading the model from S3.
 *
 * @param s3Service - Optional S3 service for remote model download.
 */
export const initTensor = async (s3Service?: S3Service) => {
  if (environmentConfig.S3_BUCKET && s3Service) {
    try {
      logger.info('* Staring new tensorflow S3 logic...');
      await s3Service.downloadTensorFlowModel(new URL('temp/', import.meta.url));
      logger.info('Tensor flow model has been loaded from S3.');
    } catch (error) {
      logger.error({ err: error }, 'Cannot download tensor flow model from S3.');
      logger.error('Use the legacy model.');
    }
  } else {
    logger.info('Skip loading model from S3 due to no S3_BUCKET or no s3Service.');
  }

  const tensorService = new TensorService('./temp/model.json', environmentConfig.TENSOR_RANK);

  if (!environmentConfig.UNIT_TESTING) {
    await tensorService.loadModel();
  }

  return tensorService;
};
