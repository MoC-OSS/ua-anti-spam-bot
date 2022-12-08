import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { urlService } from '../../services';

/**
 * @description
 * Add URLs into state. Parses URLs from parsed text from state,
 * */
export function parseUrls(context: GrammyContext, next: NextFunction) {
  if (context.state.text && !context.state.urls) {
    const urls = urlService.parseUrls(context.state.text, true);

    if (urls) {
      context.state.urls = urls;
    }
  }

  return next();
}
