const fs = require('fs');
const path = require('path');

const { env } = require('typed-dotenv').config();
const S3 = require('aws-sdk/clients/s3');

class S3Service {
  constructor() {
    /**
     * Init S3
     * */
    this.s3 = new S3({
      region: env.AWS_REGION,
    });
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
