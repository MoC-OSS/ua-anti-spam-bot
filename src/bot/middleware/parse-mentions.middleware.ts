import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { mentionService } from '../../services/mention.service';

/**
 * @description
 * Add mentions into state. Parses mentions from parsed text from state,
 * */
export function parseMentions(context: GrammyContext, next: NextFunction) {
  if (context.state.text && !context.state.mentions) {
    const mentions = mentionService.parseMentions(context.state.text);

    if (mentions) {
      context.state.mentions = mentions;
    }
  }

  return next();
}
