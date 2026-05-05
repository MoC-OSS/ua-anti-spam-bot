/**
 * @module alarm
 * @description Internal alarm types used across the bot and server processes.
 * These types are derived from the Stfalcon API types but tailored for internal use.
 */

import type { StfalconAlertType } from './stfalcon-alarm';

/**
 * An alarm event emitted by {@link AlarmService} when a region's alert status changes.
 * Carries enough information for {@link AlarmChatService} to match against chat subscriptions
 * and to format user-facing notification messages.
 */
export interface AlarmEvent {
  /** Stfalcon region identifier (numeric string). */
  regionId: string;
  /** Ukrainian region name, e.g. "Львівська область". */
  regionName: string;
  /** True when an alert started, false when the all-clear is issued. */
  alert: boolean;
  /** The primary alert type, or null when the alert ended. */
  alertType: StfalconAlertType | null;
  /** ISO 8601 timestamp of the last state change. */
  lastUpdate: string;
}
