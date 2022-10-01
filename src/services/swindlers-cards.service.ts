import isCreditCard from 'validator/es/lib/isCreditCard';

import { DynamicStorageService } from './dynamic-storage.service';

export class SwindlersCardsService {
  cards: string[] = [];

  cardRegex = /(?:\d{4}.?){3}\d{4}/g;

  constructor(private dynamicStorageService: DynamicStorageService) {
    this.cards = this.dynamicStorageService.swindlerCards;

    this.dynamicStorageService.fetchEmitter.on('fetch', () => {
      this.cards = this.dynamicStorageService.swindlerCards;
    });
  }

  /**
   * @param {string} message - raw message from user to parse
   *
   * @returns {string[]}
   */
  parseCards(message: string): string[] {
    return (message.match(this.cardRegex) || [])
      .map((card) => card.replace(/\D/g, ''))
      .filter((card) => card && card.length === 16 && isCreditCard(card));
  }

  /**
   * @param {string} name
   */
  isSpam(name: string): boolean {
    return this.cards.includes(name);
  }

  /**
   * @param {string} message - raw message from user to parse
   */
  processMessage(message: string): true | null {
    const cards = this.parseCards(message);
    if (cards.some((card) => this.cards.includes(card))) {
      return true;
    }

    return null;
  }
}
