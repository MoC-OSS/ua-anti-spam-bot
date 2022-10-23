/* eslint-disable unicorn/prefer-module */
import { environmentConfig } from '../config';

import { BaseTensorService } from './base-tensor.service';

export class SwindlersTensorService extends BaseTensorService {
  constructor(modelPath: string, SPAM_THRESHOLD: number) {
    super(modelPath, SPAM_THRESHOLD);
    this.loadModelMetadata('./swindlers-temp/model.json', './swindlers-temp/vocab.json');
  }
}

export const initSwindlersTensor = async () => {
  // if (environmentConfig.S3_BUCKET && s3Service) {
  //   try {
  //     console.info('* Staring new tensorflow S3 logic...');
  //     await s3Service.downloadTensorFlowModel(path.join(__dirname, 'swindlers-temp'));
  //     console.info('Tensor flow model has been loaded from S3.');
  //   } catch (e) {
  //     console.error('Cannot download tensor flow model from S3.\nReason: ', e);
  //     console.error('Use the legacy model.');
  //   }
  // } else {
  //   console.info('Skip loading model from S3 due to no S3_BUCKET or no s3Service.');
  // }

  const tensorService = new SwindlersTensorService('./swindlers-temp/model.json', environmentConfig.TENSOR_RANK);
  await tensorService.loadModel();

  return tensorService;
};
