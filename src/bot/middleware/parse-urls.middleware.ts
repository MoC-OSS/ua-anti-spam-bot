import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { urlService } from '../../services/url.service';

/**
 * @description
 * Add URLs into state. Parses URLs from parsed text from state,
 * */
export function parseUrls(context: GrammyContext, next: NextFunction) {
  if (context.state.text && !context.state.urls) {
    const text = urlService.parseUrls(context.state.text);

    if (text) {
      context.state.urls = text;
    }
  }

  return next();
}
