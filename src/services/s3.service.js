const fs = require('fs');
const path = require('path');

const { env } = require('typed-dotenv').config();
const AWS = require('aws-sdk');

class S3Service {
  constructor() {
    /**
     * Init S3
     * */
    this.s3 = new AWS.S3({
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
        .then(async (response) => {
          console.info(path.join(fsFolderPath, fileName));
          fs.writeFileSync(path.join(fsFolderPath, fileName), response.Body);
        }),
    );

    return Promise.all(loadFilePromises);
  }
}

module.exports = {
  S3Service,
};
