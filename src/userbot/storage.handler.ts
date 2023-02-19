// eslint-disable-next-line import/no-extraneous-dependencies
import stringSimilarity from 'string-similarity';

import { environmentConfig } from '../config';
import { GOOGLE_SHEETS_NAMES } from '../const';
import { googleService, redisService, swindlersGoogleService } from '../services';

const limits = {
  STORAGE: 999_999_999,
  LENGTH_RATE: 0.5,
};

export class UserbotStorage {
  lastMessages: string[] = [];

  swindlerMessages: string[] = [];

  helpMessages: string[] = [];

  async init() {
    const cases = Promise.all([
      googleService.getSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.STRATEGIC_POSITIVE, undefined, true),
      googleService.getSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.STRATEGIC_NEGATIVE, undefined, true),
      swindlersGoogleService.getTrainingPositives(),
      swindlersGoogleService.getTrainingNegatives(),
      redisService.redisClient.getRawValue<string[]>('training:help'),
    ]);

    return cases.then(([positives, negatives, swindlerPositives, helpMessages, redisHelp]) => {
      console.info('got TrainingTempMessages');
      this.lastMessages = [...positives, ...negatives];
      this.swindlerMessages = swindlerPositives;
      this.helpMessages = [...helpMessages, ...(Array.isArray(redisHelp) ? redisHelp : [])].filter(Boolean);
    });
  }

  async handleMessage(text: string) {
    const { isDifferent } = this.isUniqueText(text, this.lastMessages, null);

    if (isDifferent) {
      if (this.lastMessages.length > limits.STORAGE) {
        this.lastMessages = this.lastMessages.slice(this.lastMessages.length - limits.STORAGE + 1);
      }

      this.lastMessages.push(text);
      await redisService.setTrainingTempMessages(this.lastMessages);
      return true;
    }

    return false;
  }

  async handleHelpMessage(text: string) {
    const { isDifferent } = this.isUniqueText(text, this.helpMessages, 0.8);

    if (isDifferent) {
      if (this.helpMessages.length > limits.STORAGE) {
        this.helpMessages = this.helpMessages.slice(this.helpMessages.length - limits.STORAGE + 1);
      }

      this.helpMessages.push(text);
      await redisService.redisClient.setRawValue('training:help', this.helpMessages);
      return true;
    }

    return false;
  }

  /**
   * @param {string} text
   * @param {string[]} dataset
   * @param {number} [rate]
   * */
  isUniqueText(text: string, dataset: string[], rate?: number | null) {
    const isEmpty = dataset.length === 0;

    if (isEmpty) {
      return { isDifferent: true, maxChance: 1 };
    }

    const isStrictCompare = dataset.find((lastMessage) => lastMessage === text);

    if (isStrictCompare) {
      return { isDifferent: false, maxChance: 0 };
    }

    let lastChance = 0;
    let maxChance = 0;
    const isDifferent = !dataset.some((lastMessage) => {
      lastChance = stringSimilarity.compareTwoStrings(text, lastMessage);

      if (lastChance > maxChance) {
        maxChance = lastChance;
      }

      return lastChance >= (rate || limits.LENGTH_RATE);
    });

    return { isDifferent, maxChance };
  }
}
