/**
 * @module stfalcon-alarm-api.service
 * @description HTTP client for the Stfalcon Ukraine Alarm REST API (api.ukrainealarm.com).
 * Handles webhook registration/update/deletion and fetching current alert and region data.
 * @see https://api.ukrainealarm.com/swagger/index.html
 */

import { environmentConfig } from '@shared/config';

import type { StfalconRegion, StfalconRegionAlert } from '@app-types/stfalcon-alarm';

import { logger } from '@utils/logger.util';

const STFALCON_BASE_URL = 'https://api.ukrainealarm.com';

/**
 * HTTP client for the Stfalcon Ukraine Alarm API.
 * All requests are authenticated via the `Authorization` header using the API key.
 */
export class StfalconAlarmApiService {
  private readonly baseUrl: string;

  private readonly apiKey: string;

  constructor(apiKey: string, baseUrl = STFALCON_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Registers a new webhook URL with the Stfalcon API.
   * Stfalcon will send alarm notifications as HTTP POST requests to this URL.
   * @param webhookUrl - The publicly accessible URL that should receive webhook payloads.
   */
  async registerWebhook(webhookUrl: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v3/webhook`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ webHookUrl: webhookUrl }),
    });

    if (!response.ok) {
      const body = await response.text();

      logger.error(`Failed to register Stfalcon webhook (${response.status}): ${body}`);
      throw new Error(`Stfalcon registerWebhook failed with status ${response.status}`);
    }

    logger.info(`Stfalcon webhook registered: ${webhookUrl}`);
  }

  /**
   * Updates the registered webhook URL.
   * @param webhookUrl - The new publicly accessible URL for webhook delivery.
   */
  async updateWebhook(webhookUrl: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v3/webhook`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ webHookUrl: webhookUrl }),
    });

    if (!response.ok) {
      const body = await response.text();

      logger.error(`Failed to update Stfalcon webhook (${response.status}): ${body}`);
      throw new Error(`Stfalcon updateWebhook failed with status ${response.status}`);
    }

    logger.info(`Stfalcon webhook updated: ${webhookUrl}`);
  }

  /**
   * Deletes the registered webhook, stopping future Stfalcon notifications.
   */
  async deleteWebhook(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v3/webhook`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const body = await response.text();

      logger.error(`Failed to delete Stfalcon webhook (${response.status}): ${body}`);
      throw new Error(`Stfalcon deleteWebhook failed with status ${response.status}`);
    }

    logger.info('Stfalcon webhook deleted.');
  }

  /**
   * Returns regions that currently have active alerts.
   * Used to initialise the alarm state on startup.
   * @returns Array of {@link StfalconRegionAlert} objects with non-empty `activeAlerts`.
   */
  async getAlerts(): Promise<StfalconRegionAlert[]> {
    const response = await fetch(`${this.baseUrl}/api/v3/alerts`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const body = await response.text();

      logger.error(`Failed to fetch Stfalcon alerts (${response.status}): ${body}`);
      throw new Error(`Stfalcon getAlerts failed with status ${response.status}`);
    }

    return (await response.json()) as StfalconRegionAlert[];
  }

  /**
   * Returns all Ukrainian administrative regions (oblasts, districts, communities, cities).
   * Used to populate the location selection menu in the bot's web UI.
   * @returns Array of {@link StfalconRegion} objects.
   */
  async getRegions(): Promise<StfalconRegion[]> {
    const response = await fetch(`${this.baseUrl}/api/v3/regions`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const body = await response.text();

      logger.error(`Failed to fetch Stfalcon regions (${response.status}): ${body}`);
      throw new Error(`Stfalcon getRegions failed with status ${response.status}`);
    }

    return (await response.json()) as StfalconRegion[];
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: this.apiKey,
      'Content-Type': 'application/json',
    };
  }
}

export const stfalconAlarmApiService = new StfalconAlarmApiService(environmentConfig.ALARM_KEY);
