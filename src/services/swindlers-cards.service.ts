import { cardsService } from './cards.service';
import type { DynamicStorageService } from './dynamic-storage.service';

export class SwindlersCardsService {
  cards: string[] = [];

  constructor(private dynamicStorageService: DynamicStorageService) {
    this.cards = this.dynamicStorageService.swindlerCards;

    this.dynamicStorageService.fetchEmitter.on('fetch', () => {
      this.cards = this.dynamicStorageService.swindlerCards;
    });
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
    const cards = cardsService.parseCards(message);
    if (cards.some((card) => this.cards.includes(card))) {
      return true;
    }

    return null;
  }
}
