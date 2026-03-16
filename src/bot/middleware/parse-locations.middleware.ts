import type { NextFunction } from 'grammy';

import { locationsService } from '@services/locations.service';

import type { GrammyContext } from '@app-types/context';

/**
 * @param context
 * @param next
 * @description
 * Add locations into state.
 */
export function parseLocations(context: GrammyContext, next: NextFunction) {
  if (context.state.text && !context.state.locations) {
    const locations = locationsService.parseLocations(context.state.text);

    if (locations) {
      context.state.locations = locations;
    }
  }

  return next();
}
