const axios = require('axios');
const { env } = require('typed-dotenv').config();

const { processHandler } = require('../express/process.handler');

const { redisService } = require('../services/redis.service');
const { handleError } = require('../utils');

const host = `http://${env.HOST}:${env.PORT}`;

class MessageHandler {
  /**
   * @param {TensorService} tensorService
   * */
  constructor(tensorService) {
    this.tensorService = tensorService;

    /**
     * Sorted in the call order
     * */
    this.datasetPaths = {
      immediately: 'immediately',
      one_word: 'one_word',
      strict_percent_100: 'strict_percent_100',
      percent_100: 'percent_100',
      strict_high_risk: 'strict_high_risk',
      high_risk: 'high_risk',
      strict_locations: 'strict_locations',
      locations: 'locations',
    };
  }

  /**
   * @description
   * Check the message for the spam.
   * The fastest methods should as early as possible.
   * This function is performance-related.
   *
   * @param {string} message - user message
   * @param {string} originMessage - original user message
   *
   * @returns {Promise<{ immediately: boolean, tensor: boolean, location: boolean, isSpam: boolean }>} is spam result
   */
  async getTensorRank(message, originMessage) {
    const tensorRank = (await redisService.getBotTensorPercent()) || env.TENSOR_RANK;
    /**
     * immediately
     *
     * @description
     * Words that should be banned immediately 100% ahaha.
     * Strict words without fuse search.
     * */
    const immediatelyResult = await this.processMessage(originMessage, this.datasetPaths.immediately, false);

    if (immediatelyResult.rule) {
      return {
        isSpam: true,
        immediately: true,
      };
    }

    /**
     * strict_percent_100
     *
     * @description
     * Words that should be banned immediately.
     * Strict words without fuse search.
     * */
    const strictPercent100Result = await this.processMessage(message, this.datasetPaths.strict_percent_100, true);

    if (strictPercent100Result.rule) {
      return {
        isSpam: true,
        percent100: true,
      };
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
      return {
        isSpam: true,
        percent100: true,
      };
    }

    /**
     * one_word
     *
     * @description
     * Words that should be banned immediately 100% ahaha.
     * Strict words without fuse search.
     * */
    const oneWordResult = await this.processMessage(originMessage, this.datasetPaths.one_word, false);

    if (oneWordResult.rule) {
      return {
        isSpam: true,
        oneWord: true,
      };
    }

    /**
     * Get tensor result.
     * */
    const tensorResult = (await this.processTensorMessage(message, tensorRank)).result;

    /**
     * 90% is very high and it's probably spam
     */
    if (tensorResult.spamRate > tensorRank) {
      return {
        deleteRank: tensorResult.deleteRank,
        isSpam: true,
        tensor: tensorResult.spamRate,
      };
    }

    /**
     * strict_locations
     *
     * @description
     * Short locations that user can use with a high risk word.
     * Strict words without fuse search.
     * */
    const shortLocations = await this.processMessage(message, this.datasetPaths.strict_locations, true);
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

    const locationRank = finalLocations.rule ? 0.2 : 0;

    /**
     * Found location add more rank for testing
     * */
    if (tensorResult.spamRate + locationRank > tensorRank) {
      return {
        deleteRank: tensorRank,
        tensor: tensorResult.spamRate,
        isSpam: true,
        location: true,
      };
    }

    const oldLogicResult = await this.getDeleteRule(message);
    const oldLogicRank = oldLogicResult.rule ? 0.3 : 0;

    if (tensorResult.spamRate + oldLogicRank > tensorRank) {
      return {
        deleteRank: tensorRank,
        tensor: tensorResult.spamRate,
        isSpam: true,
        oldLogic: true,
      };
    }

    /**
     * Return default
     * */
    return {
      deleteRank: tensorRank,
      tensor: tensorResult.spamRate,
    };
  }

  /**
   * @deprecated
   * NOTE: Deprecated since tensor logic
   *
   * @description
   * Check the message for the spam.
   * The fastest methods should as early as possible.
   * This function is performance-related.
   *
   * @param {string} message - user message
   *
   * @returns Delete Rule
   */
  async getDeleteRule(message) {
    /**
     * Combined rules
     * */

    /**
     * strict_high_risk
     *
     * @description
     * Sensitive words that can be used with locations.
     * Strict words without fuse search.
     * */
    const shortHighRisk = await this.processMessage(message, this.datasetPaths.strict_high_risk, true);
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

    return finalHighRisk;
  }

  async processTensorMessage(message, rate) {
    try {
      if (env.USE_SERVER) {
        return await axios.post(`${host}/tensor`, { message, rate }).then((response) => response.data);
      }

      return {
        result: await this.tensorService.predict(message, rate),
      };
    } catch (e) {
      handleError(e, 'API_DOWN');
      return {
        result: await this.tensorService.predict(message, rate),
      };
    }
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

    let processResult;

    try {
      if (env.USE_SERVER) {
        processResult = await axios
          .post(`${host}/process`, {
            message,
            datasetPath,
            strict,
          })
          .then((response) => response.data);
      } else {
        processResult = {
          result: processHandler.processHandler(message, datasetPath, strict),
        };
      }
    } catch (e) {
      handleError(e, 'API_DOWN');
      processResult = {
        result: processHandler.processHandler(message, datasetPath, strict),
      };
    }

    if (processResult) {
      deleteRule.dataset = datasetPath;
      deleteRule.rule = processResult.result;
    }

    return deleteRule;
  }

  /**
   * @description
   * Removes mentions and extra spaces from the message
   *
   * @param {GrammyContext} ctx
   * @param {string} originMessage
   */
  sanitizeMessage(ctx, originMessage) {
    let message = originMessage;

    /**
     * Remove extra mentions
     * */
    try {
      message = (() => {
        let result = originMessage;

        /**
         * Replace all text mentions with spaces
         * */
        ctx?.update?.message?.entities
          ?.filter(Boolean)
          .filter((entity) => entity.type === 'text_mention')
          .forEach((entity) => {
            const mention = result.substr(entity.offset, entity.length);
            result = result.replace(mention, new Array(mention.length).fill(' ').join(''));
          });

        /**
         * Replace all @ mentions with spaces
         * */
        const atMentions = originMessage.match(/@[a-zA-Z]+/g);

        if (atMentions && atMentions.length) {
          atMentions.forEach((mention) => {
            result = result.replace(mention, new Array(mention.length).fill(' ').join(''));
          });
        }

        return result;
      })();
    } catch (e) {
      handleError(e, 'MENTION_REMOVER');
    }

    /**
     * Remove extra spaces
     * */
    try {
      message = message.replace(/\s\s+/g, ' ');
    } catch (e) {
      handleError(e, 'EXTRA_SPACE_REMOVER');
    }

    if (!message) {
      console.error('Cannot parse the message!', message);
      return false;
    }

    return message;
  }
}

module.exports = {
  MessageHandler,
};
