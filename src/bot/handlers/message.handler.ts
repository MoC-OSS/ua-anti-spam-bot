import axios from 'axios';

import type { DatasetKeys } from '@dataset/dataset';

import { processHandler } from '@server/process.handler';

import { redisService } from '@services/redis.service';

import { environmentConfig } from '@shared/config';

import type { TensorService } from '@tensor/tensor.service';

import type { GrammyContext } from '@app-types/context';
import type { SwindlerTensorResult } from '@app-types/swindlers';

import { handleError } from '@utils/error-handler.util';
import { logger } from '@utils/logger.util';

const host = `http://${environmentConfig.HOST}:${environmentConfig.PORT}`;

/** Return type for processTensorMessage containing the swindler tensor prediction result. */
export interface MessageHandlerProcessTensorMessageReturn {
  result: SwindlerTensorResult;
}

/**
 * Handles spam detection by running messages through tensor model and dataset rules.
 */
export class MessageHandler {
  /**
   * Holds the tensor service instance for spam prediction.
   * @param {TensorService} tensorService
   */
  tensorService: TensorService;

  /**
   * Sorted in the call order
   */
  datasetPaths = this.getDatasetPaths({
    immediately: 'immediately',
    one_word: 'one_word',
    strict_percent_100: 'strict_percent_100',
    percent_100: 'percent_100',
    strict_high_risk: 'strict_high_risk',
    high_risk: 'high_risk',
    strict_locations: 'strict_locations',
    locations: 'locations',
  } as const);

  constructor(tensorService: TensorService) {
    this.tensorService = tensorService;
  }

  /**
   * Strictly typing an object and return initial object as a const type.
   * @param paths - The dataset paths object to type strictly.
   * @returns The same paths object cast to a strict const type.
   */
  getDatasetPaths<TPayload extends { [key in DatasetKeys]?: key }>(paths: TPayload): TPayload {
    return paths;
  }

  /**
   * Checks the message for spam. The fastest methods run first for performance.
   * @param message - The sanitized user message to check.
   * @param originMessage - The original unmodified user message text.
   * @returns An object indicating whether the message is spam and which rule triggered.
   */
  async getTensorRank(message: string, originMessage: string) {
    const tensorRank = (await redisService.getBotTensorPercent()) || environmentConfig.TENSOR_RANK;
    /**
     * immediately
     * @description
     * Words that should be banned immediately 100% ahaha.
     * Strict words without fuse search.
     */
    const immediatelyResult = await this.processMessage(originMessage, this.datasetPaths.immediately, false);

    if (immediatelyResult.rule) {
      return {
        isSpam: true,
        immediately: true,
      };
    }

    /**
     * strict_percent_100
     * @description
     * Words that should be banned immediately.
     * Strict words without fuse search.
     */
    const strictPercent100Result = await this.processMessage(message, this.datasetPaths.strict_percent_100, true);

    if (strictPercent100Result.rule) {
      return {
        isSpam: true,
        percent100: true,
      };
    }

    /**
     * percent_100
     * @description
     * Words that should be banned immediately.
     * Fuse search, allow to find similar.
     */
    const percent100Result = await this.processMessage(message, this.datasetPaths.percent_100);

    if (percent100Result.rule) {
      return {
        isSpam: true,
        percent100: true,
      };
    }

    /**
     * one_word
     * @description
     * Words that should be banned immediately 100% ahaha.
     * Strict words without fuse search.
     */
    const oneWordResult = await this.processMessage(originMessage, this.datasetPaths.one_word, false);

    if (oneWordResult.rule) {
      return {
        isSpam: true,
        oneWord: true,
      };
    }

    /**
     * Get tensor result.
     */
    const processMessage = await this.processTensorMessage(message, tensorRank);
    const tensorResult = processMessage.result;

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
     * @description
     * Short locations that user can use with a high risk word.
     * Strict words without fuse search.
     */
    const shortLocations = await this.processMessage(message, this.datasetPaths.strict_locations, true);
    let finalLocations = shortLocations;

    /**
     * If no high risk word, skip locations step
     */
    if (!shortLocations.rule) {
      /**
       * locations
       * @description
       * Locations that user can use with a high risk word.
       * Fuse search, allow to find similar.
       */
      finalLocations = await this.processMessage(message, this.datasetPaths.locations);
    }

    const locationRank = finalLocations.rule ? 0.2 : 0;

    /**
     * Found location add more rank for testing
     */
    if (tensorResult.spamRate + locationRank > tensorRank) {
      return {
        deleteRank: tensorRank,
        tensor: tensorResult.spamRate,
        isSpam: true,
        location: true,
      };
    }

    // eslint-disable-next-line sonarjs/deprecation
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
     */
    return {
      deleteRank: tensorRank,
      tensor: tensorResult.spamRate,
    };
  }

  /**
   * Checks the message for spam using the old dataset-based rule engine.
   * The fastest methods run first for performance.
   * @deprecated NOTE: Deprecated since tensor logic
   * @param message - The user message to check.
   * @returns An object containing the matched delete rule, if any.
   */
  async getDeleteRule(message: string) {
    /**
     * Combined rules
     */

    /**
     * strict_high_risk
     * @description
     * Sensitive words that can be used with locations.
     * Strict words without fuse search.
     */
    const shortHighRisk = await this.processMessage(message, this.datasetPaths.strict_high_risk, true);
    let finalHighRisk = shortHighRisk;

    if (!shortHighRisk.rule) {
      /**
       * high_risk
       * @description
       * Sensitive words that can be used with locations.
       * Fuse search, allow to find similar.
       */
      finalHighRisk = await this.processMessage(message, this.datasetPaths.high_risk);
    }

    /**
     * If no high risk word, skip locations step
     */
    if (!finalHighRisk.rule) {
      return finalHighRisk;
    }

    return finalHighRisk;
  }

  /**
   * Sends the message to the tensor service (or server) and returns the spam prediction result.
   * @param message - The message text to evaluate.
   * @param rate - The spam rate threshold, or null to use the default.
   * @returns An object containing the tensor spam prediction result.
   */
  async processTensorMessage(message: string, rate: number | null): Promise<MessageHandlerProcessTensorMessageReturn> {
    try {
      if (environmentConfig.USE_SERVER) {
        return await axios
          .post(`${host}/tensor`, { message, rate })
          // eslint-disable-next-line @typescript-eslint/naming-convention
          .then((response: { data: { result: SwindlerTensorResult } }) => response.data);
      }

      return {
        result: await this.tensorService.predict(message, rate),
      };
    } catch (error) {
      handleError(error, 'API_DOWN');

      return {
        result: await this.tensorService.predict(message, rate),
      };
    }
  }

  /**
   * Makes a request to the server and returns the found word or null.
   * @param message - The message text to process.
   * @param datasetPath - The dataset key identifying which dataset to check against.
   * @param strict - Whether to use strict (exact) matching instead of fuzzy search.
   * @returns An object containing the matched dataset and rule, or nulls if not found.
   */
  async processMessage(message: string, datasetPath: DatasetKeys, strict = false) {
    const deleteRule: {
      dataset: string | null;
      rule: string | null;
    } = {
      dataset: null,
      rule: null,
    };

    let processResult: { result: string | null };

    try {
      processResult = environmentConfig.USE_SERVER
        ? await axios
            .post(`${host}/process`, {
              message,
              datasetPath,
              strict,
            })
            // eslint-disable-next-line @typescript-eslint/naming-convention
            .then((response: { data: { result: string | null } }) => response.data)
        : {
            result: processHandler.processHandler(message, datasetPath, strict),
          };
    } catch (error) {
      handleError(error, 'API_DOWN');

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
   * Removes mentions and extra spaces from the message for cleaner spam detection.
   * @param context - Grammy bot context used to access message entities.
   * @param originMessage - The original raw message text to sanitize.
   * @returns The sanitized message string with mentions and extra spaces removed.
   */
  sanitizeMessage(context: GrammyContext, originMessage: string): string {
    let message = originMessage;

    /**
     * Remove extra mentions
     */
    try {
      message = (() => {
        let result = originMessage;

        /**
         * Replace all text mentions with spaces
         */
        context.update?.message?.entities
          ?.filter(Boolean)
          .filter((entity) => entity.type === 'text_mention')
          .forEach((entity) => {
            // eslint-disable-next-line unicorn/prefer-string-slice, sonarjs/deprecation
            const mention = result.substr(entity.offset, entity.length);

            result = result.replace(mention, Array.from({ length: mention.length }, () => ' ').join(''));
          });

        /**
         * Replace all @ mentions with spaces
         */
        const atMentions = originMessage.match(/@[A-Za-z]+/g);

        if (atMentions && atMentions.length > 0) {
          atMentions.forEach((mention) => {
            result = result.replace(mention, Array.from({ length: mention.length }, () => ' ').join(''));
          });
        }

        return result;
      })();
    } catch (error) {
      handleError(error, 'MENTION_REMOVER');
    }

    /**
     * Remove extra spaces
     */
    try {
      message = message.replaceAll(/\s\s+/g, ' ');
    } catch (error) {
      handleError(error, 'EXTRA_SPACE_REMOVER');
    }

    if (!message) {
      logger.error({ message }, 'Cannot parse the message!');

      return '';
    }

    return message;
  }
}
