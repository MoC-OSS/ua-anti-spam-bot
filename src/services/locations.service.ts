/**
 * @module locations.service
 * @description Parses Ukrainian location names from messages using a static dataset.
 */

import { dataset } from '../../dataset/dataset';

export class LocationsService {
  /**
   * Extracts Ukrainian location names found in the message text.
   * @param {string} message - raw message from user to parse
   *
   * @returns {string[]}
   */
  parseLocations(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const foundLocation = dataset.locations.find((location) => lowerMessage.includes(location));

    if (foundLocation === undefined) {
      return [];
    }

    return [foundLocation];
  }
}

export const locationsService = new LocationsService();
