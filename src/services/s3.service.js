const fs = require('fs');
const path = require('path');

const { env } = require('typed-dotenv').config();
const AWS = require('aws-sdk');
const S3 = require('aws-sdk/clients/s3');

class S3Service {
  constructor() {
    /**
     * Update global config
     * */
    AWS.config.update({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
    });

    this.s3 = new S3({ apiVersion: '2006-03-01' });
    this.mlFiles = ['group1-shard1of1.bin', 'model.json', 'vocab.json'];

    /**
     * @type {Record<string, string>}
     * */
    this.config = {
      bucket: env.S3_BUCKET,
      path: env.S3_PATH,
    };
  }

  /**
   * Download tensor flow model into the specific folder
   * */
  downloadTensorFlowModel(fsFolderPath) {
    const loadFilePromises = this.mlFiles.map((fileName) =>
      this.s3
        .getObject({ Bucket: this.config.bucket, Key: path.join(this.config.path, fileName) })
        .promise()
        .then((response) => {
          fs.writeFileSync(path.join(fsFolderPath, fileName), response.Body.toString());
        }),
    );

    return Promise.all(loadFilePromises);
  }
}

module.exports = {
  S3Service,
};
