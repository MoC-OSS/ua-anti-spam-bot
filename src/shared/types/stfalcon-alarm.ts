/**
 * @module stfalcon-alarm
 * @description Type definitions for the Stfalcon Ukraine Alarm API (api.ukrainealarm.com).
 * These types represent the webhook payload and REST API response structures.
 * @see https://api.ukrainealarm.com/swagger/index.html
 */

/**
 * The type of alert issued by the Stfalcon API.
 * AIR represents an air-raid alert; other types cover additional threat categories.
 */
export type StfalconAlertType = 'AIR' | 'ARTILLERY' | 'CHEMICAL' | 'CUSTOM' | 'INFO' | 'NUCLEAR' | 'UNKNOWN' | 'URBAN_FIGHTS';

/**
 * The administrative region type within the Ukrainian territorial hierarchy.
 */
export type StfalconRegionType = 'City' | 'CityDistrict' | 'CityOrVillage' | 'Community' | 'District' | 'Null' | 'State';

/**
 * A single active alert within a region, as returned in the `activeAlerts` array.
 */
export interface StfalconActiveAlert {
  regionId: string;
  regionType: StfalconRegionType;
  type: StfalconAlertType;
  lastUpdate: string;
}

/**
 * A region's alert status as returned by `GET /api/v3/alerts` or via webhook payload.
 * When `activeAlerts` is empty, all alerts for this region have ended.
 */
export interface StfalconRegionAlert {
  regionId: string;
  regionName: string;
  regionEngName: string;
  regionType: StfalconRegionType;
  lastUpdate: string;
  activeAlerts: StfalconActiveAlert[];
}

/**
 * A region definition as returned by `GET /api/v3/regions`.
 * The structure is hierarchical: states contain districts, districts contain communities, etc.
 */
export interface StfalconRegion {
  regionId: string;
  regionName: string;
  regionType: StfalconRegionType;
  /** Child regions in the hierarchy (e.g. districts within a state). */
  regionChildIds: StfalconRegion[];
}

/**
 * Response wrapper for `GET /api/v3/regions`.
 */
export interface StfalconRegionsResponse {
  states: StfalconRegion[];
}

/**
 * The message shape published on the Redis alarm pub/sub channel.
 * Bridges the server-side webhook handler and the bot-side consumer.
 */
export interface AlarmPubSubMessage {
  /** Stfalcon region identifier (numeric string). */
  regionId: string;
  /** Ukrainian region name, e.g. "Львівська область". */
  regionName: string;
  /** True when an alert is active, false when the all-clear is issued. */
  alert: boolean;
  /** The primary alert type, or null when the alert ended. */
  alertType: StfalconAlertType | null;
  /** ISO 8601 timestamp of the last state change. */
  lastUpdate: string;
}
