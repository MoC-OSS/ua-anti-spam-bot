import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { cardsService } from '../../services';

/**
 * @description
 * Add cards into state. Parses cards from parsed text from state,
 * */
export function parseCards(context: GrammyContext, next: NextFunction) {
  if (context.state.text && !context.state.cards) {
    const cards = cardsService.parseCards(context.state.text);

    if (cards) {
      context.state.cards = cards;
    }
  }

  return next();
}
