import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { mentionService } from '../../services';
import { removeDuplicates } from '../../utils';

/**
 * @description
 * Add mentions into state. Parses mentions from parsed text from state,
 * */
export function parseMentions(context: GrammyContext, next: NextFunction) {
  if (context.state.text && !context.state.mentions) {
    const mentions = mentionService.parseMentions(context.state.text);
    const entitiesMentions =
      context.state.entities
        ?.map((entity) => {
          if (entity.type === 'mention') {
            return entity.value;
          }

          if (entity.type === 'text_mention') {
            return entity.value.username;
          }

          return null;
        })
        .filter((entity: string | undefined | null): entity is string => !!entity) || [];

    context.state.mentions = removeDuplicates([...mentions, ...entitiesMentions]);
  }

  return next();
}
