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
  }

  async init() {
    const cases = Promise.all([
      googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_POSITIVE_SHEET_NAME),
      googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_NEGATIVE_SHEET_NAME),
    ]);

    return cases.then(([positives, negatives]) => {
      console.info('got TrainingTempMessages');
      this.lastMessages = [...positives.map((positive) => positive.value), ...negatives.map((negative) => negative.value)];
    });
  }

  handleMessage(str) {
    const isUniqueText = this.isUniqueText(str);

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

  isUniqueText(str) {
    const isEmpty = !this.lastMessages.length;

    if (isEmpty) {
      return true;
    }

    const isStrictCompare = this.lastMessages.some((lastMessage) => lastMessage === str);

    if (isStrictCompare) {
      return false;
    }

    const isDifferent = !this.lastMessages.some((lastMessage) => stringSimilarity.compareTwoStrings(str, lastMessage) > limits.LENGTH_RATE);

    return isDifferent;
  }
}

module.exports = {
  UserbotStorage,
};
