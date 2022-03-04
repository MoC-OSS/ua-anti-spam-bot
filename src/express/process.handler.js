const lodashGet = require('lodash.get');

const { messageUtil } = require('../utils');
const dataset = require('../../dataset/rules.json');

class ProcessHandler {
  /**
   * @param {string} message
   * @param {string} datasetPath
   * @param {boolean} strict
   * */
  processHandler(message, datasetPath, strict = false) {
    /**
     * @type string[]
     * */
    const words = lodashGet(dataset, datasetPath.replace('_$', ''));
    const directHit = words.some((word) => messageUtil.findInText(message, word, strict));

    if (directHit) {
      return true;
    }

    const fuseHit = messageUtil.fuseInText(message, words);

    if (fuseHit) {
      return true;
    }

    return false;
  }
}

const processHandler = new ProcessHandler();

module.exports = {
  processHandler,
};
