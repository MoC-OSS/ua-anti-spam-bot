import type { NextFunction } from 'grammy';

import { mentionService } from '@services/mention.service';

import type { GrammyContext } from '@app-types/context';

import { removeDuplicates } from '@utils/remove-duplicates.util';

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
        .filter((entity: string | null | undefined): entity is string => !!entity) || [];

    context.state.mentions = removeDuplicates([...mentions, ...entitiesMentions]);
  }

  return next();
}
