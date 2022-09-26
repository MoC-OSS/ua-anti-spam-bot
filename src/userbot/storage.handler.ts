const { env } = require('typed-dotenv').config();
// eslint-disable-next-line import/no-extraneous-dependencies
const stringSimilarity = require('string-similarity');

const { redisService } = require('../services/redis.service');
const { googleService } = require('../services/google.service');
const { swindlersGoogleService } = require('../services/swindlers-google.service');

const limits = {
  STORAGE: 999999999,
  LENGTH_RATE: 0.5,
};

export class UserbotStorage {
  lastMessages: any[];
  swindlerMessages: any[];
  helpMessages: any[];
  constructor() {
    this.lastMessages = [];
    this.swindlerMessages = [];
    this.helpMessages = [];
  }

  async init() {
    const sheetRequests = [
      googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_POSITIVE_SHEET_NAME),
      googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_NEGATIVE_SHEET_NAME),
    ].map((request) => request.then((response) => response.map((positive) => positive.value)));

    const cases = Promise.all([
      ...sheetRequests,
      swindlersGoogleService.getTrainingPositives(),
      swindlersGoogleService.getTrainingNegatives(),
      redisService.redisClient.getRawValue('training:help', this.helpMessages),
    ]);

    return cases.then(([positives, negatives, swindlerPositives, helpMessages, redisHelp]) => {
      console.info('got TrainingTempMessages');
      this.lastMessages = [...positives, ...negatives];
      this.swindlerMessages = swindlerPositives;
      this.helpMessages = [...helpMessages, ...(redisHelp || [])].filter(Boolean);
    });
  }

  handleMessage(str) {
    const { isDifferent } = this.isUniqueText(str, this.lastMessages, null);

    if (isDifferent) {
      if (this.lastMessages.length > limits.STORAGE) {
        this.lastMessages = this.lastMessages.slice(this.lastMessages.length - limits.STORAGE + 1);
      }

      this.lastMessages.push(str);
      redisService.setTrainingTempMessages(this.lastMessages);
      return true;
    }

    return false;
  }

  handleHelpMessage(str) {
    const { isDifferent } = this.isUniqueText(str, this.helpMessages, 0.8);

    if (isDifferent) {
      if (this.helpMessages.length > limits.STORAGE) {
        this.helpMessages = this.helpMessages.slice(this.helpMessages.length - limits.STORAGE + 1);
      }

      this.helpMessages.push(str);
      redisService.redisClient.setRawValue('training:help', this.helpMessages);
      return true;
    }

    return false;
  }

  /**
   * @param {string} str
   * @param {string[]} dataset
   * @param {number} [rate]
   * */
  isUniqueText(str, dataset, rate) {
    const isEmpty = !dataset.length;

    if (isEmpty) {
      return { isDifferent: true, maxChance: 1 };
    }

    const isStrictCompare = dataset.find((lastMessage) => lastMessage === str);

    if (isStrictCompare) {
      return { isDifferent: false, maxChance: 0 };
    }

    let lastChance = 0;
    let maxChance = 0;
    const isDifferent = !dataset.some((lastMessage) => {
      lastChance = stringSimilarity.compareTwoStrings(str, lastMessage);

      if (lastChance > maxChance) {
        maxChance = lastChance;
      }

      return lastChance >= (rate || limits.LENGTH_RATE);
    });

    return { isDifferent, maxChance };
  }
}

module.exports = {
  UserbotStorage,
};
