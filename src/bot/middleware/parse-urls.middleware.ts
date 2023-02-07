import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { urlService } from '../../services';
import { removeDuplicates } from '../../utils';

/**
 * @description
 * Add URLs into state. Parses URLs from parsed text from state,
 * */
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
