/**
 * @module s3.service
 * @description AWS S3 client service for downloading TensorFlow model files.
 */

import fs from 'node:fs';
import path from 'node:path';

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { environmentConfig } from '@shared/config';

import { logger } from '@utils/logger.util';

export class S3Service {
  s3 = new S3Client({
    region: environmentConfig.AWS_REGION,
  });

  mlFiles: string[] = ['group1-shard1of1.bin', 'model.json', 'vocab.json'];

  config = {
    bucket: environmentConfig.S3_BUCKET,
    path: environmentConfig.S3_PATH,
  };

  /**
   * Download tensor flow model into the specific folder
   * @param fsFolderPath
   */
  downloadTensorFlowModel(fsFolderPath: URL) {
    const loadFilePromises = this.mlFiles.map(async (fileName) => {
      const response = await this.s3.send(
        new GetObjectCommand({ Bucket: this.config.bucket || '', Key: path.join(this.config.path, fileName) }),
      );

      logger.info(new URL(fileName, fsFolderPath));

      const body = (await response.Body?.transformToString()) || '';

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.writeFileSync(new URL(fileName, fsFolderPath), body);
    });

    return Promise.all(loadFilePromises);
  }
}
