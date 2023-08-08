import { environmentConfig } from '../config';
import type { S3Service } from '../services';

import { BaseTensorService } from './base-tensor.service';

export class TensorService extends BaseTensorService {
  constructor(modelPath: string, SPAM_THRESHOLD: number) {
    super(modelPath, SPAM_THRESHOLD);
    this.loadModelMetadata('./temp/model.json', './temp/vocab.json');
  }
}

export const initTensor = async (s3Service?: S3Service) => {
  if (environmentConfig.S3_BUCKET && s3Service) {
    try {
      console.info('* Staring new tensorflow S3 logic...');
      await s3Service.downloadTensorFlowModel(new URL('temp', import.meta.url));
      console.info('Tensor flow model has been loaded from S3.');
    } catch (error) {
      console.error('Cannot download tensor flow model from S3.\nReason:', error);
      console.error('Use the legacy model.');
    }
  } else {
    console.info('Skip loading model from S3 due to no S3_BUCKET or no s3Service.');
  }

  const tensorService = new TensorService('./temp/model.json', environmentConfig.TENSOR_RANK);
  await tensorService.loadModel();

  return tensorService;
};
