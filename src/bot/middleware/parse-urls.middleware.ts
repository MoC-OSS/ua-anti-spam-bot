import type { NextFunction } from 'grammy';

import { urlService } from '@services/url.service';

import type { GrammyContext } from '@app-types/context';

import { removeDuplicates } from '@utils/remove-duplicates.util';

/**
 * @param context
 * @param next
 * @description
 * Add URLs into state. Parses URLs from parsed text from state,
 */
export function parseUrls(context: GrammyContext, next: NextFunction) {
  if (context.state.text && !context.state.urls) {
    const parsedUrls = urlService.parseUrls(context.state.text, true);

    const entitiesUrls =
      context.state.entities
        ?.map((entity) => {
          if (entity.type === 'url' || entity.type === 'text_link') {
            return entity.value;
          }

          return null;
        })
        .filter((entity): entity is string => !!entity) || [];

    context.state.urls = removeDuplicates([...parsedUrls, ...entitiesUrls]);
  }

  return next();
}
