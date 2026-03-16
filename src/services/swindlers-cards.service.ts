/**
 * @module swindlers-cards.service
 * @description Detects known swindler payment card numbers in messages
 * by comparing parsed card numbers against a dynamic blacklist.
 */

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
   * Checks whether the given card number is in the swindler blacklist.
   * @param name - credit card number to check against the blacklist
   * @returns true if the card number is in the swindler list, false otherwise
   */
  isSpam(name: string): boolean {
    return this.cards.includes(name);
  }

  /**
   * Parses card numbers from the message and checks them against the blacklist.
   * @param message - raw message from user to parse
   * @returns true if a swindler card was found in the message, null otherwise
   */
  processMessage(message: string): true | null {
    const cards = cardsService.parseCards(message);

    if (cards.some((card) => this.cards.includes(card))) {
      return true;
    }

    return null;
  }
}
