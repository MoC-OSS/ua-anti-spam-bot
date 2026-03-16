import type { NextFunction } from 'grammy';

import { cardsService } from '@services/cards.service';

import type { GrammyContext } from '@app-types/context';

/**
 * Add cards into state. Parses cards from parsed text from state.
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export function parseCards(context: GrammyContext, next: NextFunction) {
  if (context.state.text && !context.state.cards) {
    context.state.cards = cardsService.parseCards(context.state.text);
  }

  return next();
}
