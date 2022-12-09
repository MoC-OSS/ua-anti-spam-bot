import locations from '../../dataset/strings/locations.json';

export class LocationsService {
  /**
   * @param {string} message - raw message from user to parse
   *
   * @returns {string[]}
   */
  parseLocations(message: string): string[] {
    const foundLocation = locations.find((location) => message.includes(location));
    if (foundLocation === undefined) return [];
    return [foundLocation];
  }
}

export const locationsService = new LocationsService();
