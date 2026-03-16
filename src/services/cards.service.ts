/**
 * @module cards.service
 * @description Parses and validates payment card numbers from raw message text
 * using regex extraction and credit-card validation.
 */

import isCreditCard from 'validator/lib/isCreditCard';

export class CardsService {
  // eslint-disable-next-line security/detect-unsafe-regex
  cardRegex = /(?:\d{4}.?){3}\d{4}/g;

  /**
   * Extracts and validates credit card numbers from raw message text.
   * @param message - raw message from user to parse
   * @returns
   */
  parseCards(message: string): string[] {
    // eslint-disable-next-line sonarjs/prefer-regexp-exec
    return (message.match(this.cardRegex) || ([] as string[]))
      .map((card) => card.replaceAll(/\D/g, ''))
      .filter((card) => card && card.length === 16 && isCreditCard(card));
  }
}

export const cardsService = new CardsService();
