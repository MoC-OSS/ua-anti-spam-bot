import isCreditCard from 'validator/lib/isCreditCard';

export class CardsService {
  // eslint-disable-next-line security/detect-unsafe-regex
  cardRegex = /(?:\d{4}.?){3}\d{4}/g;

  /**
   * @param {string} message - raw message from user to parse
   *
   * @returns {string[]}
   */
  parseCards(message: string): string[] {
    // eslint-disable-next-line sonarjs/prefer-regexp-exec
    return (message.match(this.cardRegex) || ([] as string[]))
      .map((card) => card.replaceAll(/\D/g, ''))
      .filter((card) => card && card.length === 16 && isCreditCard(card));
  }
}

export const cardsService = new CardsService();
