import type { NextFunction } from 'grammy';

import { locationsService } from '@services/locations.service';

import type { GrammyContext } from '@app-types/context';

/**
 * Add locations into state.
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
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
