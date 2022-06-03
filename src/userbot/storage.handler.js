const { env } = require('typed-dotenv').config();
// eslint-disable-next-line import/no-extraneous-dependencies
const stringSimilarity = require('string-similarity');

const { redisService } = require('../services/redis.service');
const { googleService } = require('../services/google.service');

const limits = {
  STORAGE: 999999999,
  LENGTH_RATE: 0.5,
};

class UserbotStorage {
  constructor() {
    this.lastMessages = [];
    this.swindlerMessages = [];
    this.helpMessages = [];
  }

  async init() {
    const sheetRequests = [
      googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_POSITIVE_SHEET_NAME),
      googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_NEGATIVE_SHEET_NAME),
      googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, 'B6:B'),
      googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, 'A6:A'),
    ].map((request) => request.then((response) => response.map((positive) => positive.value)));

    const cases = Promise.all([...sheetRequests, redisService.redisClient.getRawValue('training:help', this.helpMessages)]);

    return cases.then(([positives, negatives, swindlerPositives, helpMessages, redisHelp]) => {
      console.info('got TrainingTempMessages');
      this.lastMessages = [...positives, ...negatives];
      this.swindlerMessages = swindlerPositives;
      this.helpMessages = [...helpMessages, ...(redisHelp || [])].filter(Boolean);
    });
  }

  handleMessage(str) {
    const isUniqueText = this.isUniqueText(str, this.lastMessages);

    if (isUniqueText) {
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
    const isUniqueText = this.isUniqueText(str, this.helpMessages, 0.8);

    if (isUniqueText) {
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
    const isEmpty = !this.lastMessages.length;

    if (isEmpty) {
      return true;
    }

    const isStrictCompare = dataset.some((lastMessage) => lastMessage === str);

    if (isStrictCompare) {
      return false;
    }

    const isDifferent = !dataset.some((lastMessage) => stringSimilarity.compareTwoStrings(str, lastMessage) > (rate || limits.LENGTH_RATE));

    return isDifferent;
  }
}

module.exports = {
  UserbotStorage,
};
