import fs from 'node:fs';
import path from 'node:path';
import type { S3 } from 'aws-sdk';
import AWS from 'aws-sdk';

import { environmentConfig } from '../config';

export class S3Service {
  s3: S3 = new AWS.S3({
    region: environmentConfig.AWS_REGION,
  });

  mlFiles: string[] = ['group1-shard1of1.bin', 'model.json', 'vocab.json'];

  config = {
    bucket: environmentConfig.S3_BUCKET,
    path: environmentConfig.S3_PATH,
  };

  /**
   * Download tensor flow model into the specific folder
   * */
  downloadTensorFlowModel(fsFolderPath: URL) {
    const loadFilePromises = this.mlFiles.map((fileName) =>
      this.s3
        .getObject({ Bucket: this.config.bucket || '', Key: path.join(this.config.path, fileName) })
        .promise()
        .then((response) => {
          console.info(new URL(fileName, fsFolderPath));
          fs.writeFileSync(new URL(fileName, fsFolderPath), response.Body?.toString() || '');
        }),
    );

    return Promise.all(loadFilePromises);
  }
}
