const fs = require('fs');
const path = require('path');

const { env } = require('typed-dotenv').config();
const { optimizeText } = require('ukrainian-ml-optimizer');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');

export class TensorService {
  model:any;
  SPAM_THRESHOLD:any;
  modelPath:any;
  DICTIONARY:any;
  MODEL:any;
  DICTIONARY_EXTRAS:any;
  modelLength:any;
  constructor(modelPath, spamThreshold) {
    /**
     * @type {import('@tensorflow/tfjs').LayersModel}
     * */
    this.model = null;
    this.SPAM_THRESHOLD = spamThreshold;
    this.modelPath = modelPath;

    try {
      this.DICTIONARY = JSON.parse(fs.readFileSync(path.join(__dirname, './temp/vocab.json')).toString());
      this.MODEL = JSON.parse(fs.readFileSync(path.join(__dirname, './temp/model.json')).toString());
    } catch (e) {
      console.error('Cannot parse model! Reason:');
      console.error(e);
    }

    this.DICTIONARY_EXTRAS = this.getDictionaryExtras();
    this.modelLength = this.MODEL.modelTopology.model_config.config.layers[1].config.input_length;
  }

  setSpamThreshold(newThreshold) {
    if (newThreshold && +newThreshold) {
      this.SPAM_THRESHOLD = newThreshold;
    }
  }

  async loadModel() {
    const fullModelPath = path.join(__dirname, this.modelPath);

    this.model = await tf.loadLayersModel(`file://${fullModelPath}`);
  }

  async predict(word, rate) {
    const tensorRank = this.tokenize(word);
    const tensorPredict = this.model.predict(tensorRank.tensor);
    const fullModelPath = path.join(__dirname, this.modelPath);

    const deleteRank = rate || this.SPAM_THRESHOLD;

    /**
     * @type {Stats | null}
     * */
    let fileStat = null;

    if (env.TEST_TENSOR) {
      try {
        fileStat = fs.statSync(fullModelPath);
      } catch (e) {
        fileStat = null;
      }
    }

    return tensorPredict.data().then((numericData) => ({
      spamRate: numericData[1],
      deleteRank,
      isSpam: numericData[1] > deleteRank,
      tensorRank: tensorRank.tokenArray,
      fileStat,
    }));
  }

  tokenize(message) {
    // Always start with the START token.
    const returnArray = [this.DICTIONARY_EXTRAS.START];

    // Convert sentence to lower case which ML Model expects
    // Strip all characters that are not alphanumeric or spaces
    // Then split on spaces to create a word array.
    const wordArray = optimizeText(message)
      .split(' ')
      .slice(0, this.modelLength - 1);

    let index = 0;

    // Loop through the words in the sentence you want to encode.
    // If word is found in dictionary, add that number else
    // you add the UNKNOWN token.
    wordArray.forEach((word) => {
      const encoding = this.DICTIONARY.indexOf(word);
      returnArray.push(encoding === -1 ? this.DICTIONARY_EXTRAS.UNKNOWN : encoding);
      index += 1;
    });

    // Finally if the number of words was < the minimum encoding length
    // minus 1 (due to the start token), fill the rest with PAD tokens.
    while (index < this.modelLength - 1) {
      returnArray.push(this.DICTIONARY_EXTRAS.PAD);
      index += 1;
    }

    // Convert to a TensorFlow Tensor and return that.
    return {
      tokenArray: returnArray,
      tensor: tf.tensor([returnArray]),
    };
  }

  /**
   * @private
   * */
  getDictionaryExtras() {
    return {
      START: 0,
      UNKNOWN: 1,
      PAD: 2,
    };
  }
}

export const initTensor = async (s3Service) => {
  if (env.S3_BUCKET && s3Service) {
    try {
      console.info('* Staring new tensorflow S3 logic...');
      await s3Service.downloadTensorFlowModel(path.join(__dirname, 'temp'));
      console.info('Tensor flow model has been loaded from S3.');
    } catch (e) {
      console.error('Cannot download tensor flow model from S3.\nReason: ', e);
      console.error('Use the legacy model.');
    }
  } else {
    console.info('Skip loading model from S3 due to no S3_BUCKET or no s3Service.');
  }

  const tensorService = new TensorService('./temp/model.json', env.TENSOR_RANK);
  await tensorService.loadModel();

  return tensorService;
}
