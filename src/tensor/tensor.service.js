const fs = require('fs');
const path = require('path');

const { env } = require('typed-dotenv').config();
const { optimizeText } = require('ukrainian-ml-optimizer');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');

// eslint-disable-next-line import/no-unresolved
const DICTIONARY = require('./temp/vocab.json');
// eslint-disable-next-line import/no-unresolved
const MODEL = require('./temp/model.json');

class TensorService {
  constructor(modelPath, spamThreshold) {
    /**
     * @type {import('@tensorflow/tfjs').LayersModel}
     * */
    this.model = null;
    this.SPAM_THRESHOLD = spamThreshold;
    this.modelPath = modelPath;

    this.DICTIONARY_EXTRAS = this.getDictionaryExtras();
    this.modelLength = MODEL.modelTopology.model_config.config.layers[1].config.input_length;
  }

  setSpamThreshold(newThreshold) {
    if (newThreshold) {
      this.SPAM_THRESHOLD = newThreshold;
    }
  }

  async loadModel() {
    const fullModelPath = path.join(__dirname, this.modelPath);

    this.model = await tf.loadLayersModel(`file://${fullModelPath}`);
  }

  predict(word) {
    const tensorRank = this.tokenize(word);
    const tensorPredict = this.model.predict(tensorRank.tensor);
    const fullModelPath = path.join(__dirname, this.modelPath);

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
      deleteRank: this.SPAM_THRESHOLD,
      isSpam: numericData[1] > this.SPAM_THRESHOLD,
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
      const encoding = DICTIONARY.indexOf(word);
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

module.exports = {
  TensorService,
  initTensor: async () => {
    const tensorService = new TensorService('./temp/model.json', env.TENSOR_RANK);
    await tensorService.loadModel();

    return tensorService;
  },
};
