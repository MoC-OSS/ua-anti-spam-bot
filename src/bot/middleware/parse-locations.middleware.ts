import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { locationsService } from '../../services';

/**
 * @description
 * Add locations into state.
 * */
export function parseLocations(context: GrammyContext, next: NextFunction) {
  if (context.state.text && !context.state.locations) {
    const locations = locationsService.parseLocations(context.state.text);

    if (locations) {
      context.state.locations = locations;
    }
  }

  return next();
}
