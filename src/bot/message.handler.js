const axios = require('axios');
const { env } = require('typed-dotenv').config();

const { handleError } = require('../utils');

const host = `http://${env.HOST}:${env.PORT}`;

class MessageHandler {
  constructor() {
    /**
     * Sorted in the call order
     * */
    this.datasetPaths = {
      strict_percent_100: '_$dataset.strict_percent_100',
      percent_100: '_$dataset.percent_100',
      short_high_risk: '_$dataset.short_high_risk',
      high_risk: '_$dataset.high_risk',
      short_locations: '_$dataset.short_locations',
      locations: '_$dataset.locations',
    };
  }

  /**
   * @description
   * Check the message for the spam.
   * The fastest methods should as earlier as possible.
   * This function is performance related.
   *
   * @param {string} message - user message
   *
   * @returns Delete Rule
   */
  async getDeleteRule(message) {
    /**
     * strict_percent_100
     *
     * @description
     * Words that should be banned immediately.
     * Strict words without fuse search.
     * */
    const strictPercent100Result = await this.processMessage(message, this.datasetPaths.strict_percent_100, true);

    if (strictPercent100Result.rule) {
      return strictPercent100Result;
    }

    /**
     * percent_100
     *
     * @description
     * Words that should be banned immediately.
     * Fuse search, allow to find similar.
     * */
    const percent100Result = await this.processMessage(message, this.datasetPaths.percent_100);

    if (percent100Result.rule) {
      return percent100Result;
    }

    /**
     * Combined rules
     * */

    /**
     * short_high_risk
     *
     * @description
     * Sensitive words that can be used with locations.
     * Strict words without fuse search.
     * */
    const shortHighRisk = await this.processMessage(message, this.datasetPaths.short_high_risk, true);
    let finalHighRisk = shortHighRisk;

    if (!shortHighRisk.rule) {
      /**
       * high_risk
       *
       * @description
       * Sensitive words that can be used with locations.
       * Fuse search, allow to find similar.
       * */
      finalHighRisk = await this.processMessage(message, this.datasetPaths.high_risk);
    }

    /**
     * If no high risk word, skip locations step
     * */
    if (!finalHighRisk.rule) {
      return finalHighRisk;
    }

    /**
     * short_locations
     *
     * @description
     * Short locations that user can use with a high risk word.
     * Strict words without fuse search.
     * */
    const shortLocations = await this.processMessage(message, this.datasetPaths.short_locations, true);
    let finalLocations = shortLocations;

    /**
     * If no high risk word, skip locations step
     * */
    if (!shortLocations.rule) {
      /**
       * locations
       *
       * @description
       * Locations that user can use with a high risk word.
       * Fuse search, allow to find similar.
       * */
      finalLocations = await this.processMessage(message, this.datasetPaths.locations);
    }

    /**
     * If no locations, message is safe
     * */
    if (!finalLocations.rule) {
      return {
        dataset: null,
        rule: null,
      };
    }

    return finalHighRisk;
  }

  /**
   * @private
   * @description
   * Makes request on the server and receives found word {string} or {null}
   *
   * @param {string} message
   * @param {string} datasetPath
   * @param {boolean} strict
   */
  async processMessage(message, datasetPath, strict = false) {
    const deleteRule = {
      dataset: null,
      rule: null,
    };

    try {
      const processResult = await axios
        .post(`${host}/process`, {
          message,
          datasetPath,
          strict,
        })
        .then((response) => response.data);

      if (processResult) {
        deleteRule.dataset = datasetPath;
        deleteRule.rule = processResult.result;
      }
    } catch (e) {
      handleError(e, 'API_DOWN');
    }

    return deleteRule;
  }
}

const messageHandler = new MessageHandler();

module.exports = {
  messageHandler,
};
