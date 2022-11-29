import isCreditCard from 'validator/lib/isCreditCard';

export class CardsService {
  cardRegex = /(?:\d{4}.?){3}\d{4}/g;

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
}

export const cardsService = new CardsService();
