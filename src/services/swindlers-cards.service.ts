import { isCreditCard } from 'validator';

import { DynamicStorageService } from './dynamic-storage.service';

export class SwindlersCardsService {
  /**
   * @param {DynamicStorageService} dynamicStorageService
   * */
  dynamicStorageService: DynamicStorageService;

  cards: any;

  cardRegex: RegExp;

  constructor(dynamicStorageService) {
    this.dynamicStorageService = dynamicStorageService;
    this.cards = this.dynamicStorageService.swindlerCards;

    this.cardRegex = /(?:\d{4}.?){3}\d{4}/g;

    this.dynamicStorageService.fetchEmitter.on('fetch', () => {
      this.cards = this.dynamicStorageService.swindlerCards;
    });
  }

  /**
   * @param {string} message - raw message from user to parse
   *
   * @returns {string[]}
   */
  parseCards(message) {
    return (message.match(this.cardRegex) || [])
      .map((card) => card.replace(/\D/g, ''))
      .filter((card) => card && card.length === 16 && isCreditCard(card));
  }

  /**
   * @param {string} name
   */
  isSpam(name) {
    return this.cards.includes(name);
  }

  /**
   * @param {string} message - raw message from user to parse
   */
  processMessage(message) {
    const cards = this.parseCards(message);
    if (cards.some((card) => this.cards.includes(card))) {
      return true;
    }

    return null;
  }
}

module.exports = {
  SwindlersCardsService,
};
