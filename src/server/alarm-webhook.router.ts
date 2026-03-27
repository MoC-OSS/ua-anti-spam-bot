/**
 * @module alarm-webhook.router
 * @description Express router that receives alarm webhook payloads from the Stfalcon API
 * and publishes them to the Redis alarm channel for the bot process to consume.
 *
 * Security: every incoming request is verified against the `X-Alarm-Secret` header.
 * In local development (ENV=local) the check is skipped so ngrok testing works without
 * configuring the secret.
 */

import type { Request, Response } from 'express';
import { Router } from 'express';

import { ALARM_CHANNEL } from '@db/redis-pubsub';

import { environmentConfig } from '@shared/config';

import type { AlarmPubSubMessage, StfalconRegionAlert } from '@app-types/stfalcon-alarm';

import { logger } from '@utils/logger.util';

/** Minimal interface needed from the Redis publisher client. */
export interface AlarmPublisher {
  publish(channel: string, message: string): Promise<number>;
}

/** Header name used to authenticate incoming webhook calls. */
const WEBHOOK_SECRET_HEADER = 'x-alarm-secret';

/**
 * Returns true if the incoming request carries a valid webhook secret.
 * In local development the check is bypassed to simplify ngrok testing.
 * @param request - The incoming Express request.
 * @returns `true` when the request is allowed to proceed; `false` otherwise.
 */
function isAuthorized(request: Request): boolean {
  if (environmentConfig.ENV === 'local') {
    return true;
  }

  const secret = environmentConfig.ALARM_WEBHOOK_SECRET;

  if (!secret) {
    logger.warn('Alarm webhook: ALARM_WEBHOOK_SECRET is not configured — requests will be rejected.');

    return false;
  }

  return request.headers[WEBHOOK_SECRET_HEADER] === secret;
}

/**
 * Converts each Stfalcon region alert to an {@link AlarmPubSubMessage} and publishes it
 * to the Redis alarm channel.
 * @param publisher - A connected Redis client.
 * @param regions - Array of region alert objects from the Stfalcon webhook payload.
 */
async function processWebhookPayload(publisher: AlarmPublisher, regions: StfalconRegionAlert[]): Promise<void> {
  await Promise.all(
    regions.map(async (region) => {
      const isAlert = region.activeAlerts.length > 0;
      const primaryAlert = region.activeAlerts[0] ?? null;

      const message: AlarmPubSubMessage = {
        regionId: region.regionId,
        regionName: region.regionName,
        alert: isAlert,
        alertType: primaryAlert?.type ?? null,
        lastUpdate: region.lastUpdate,
      };

      await publisher.publish(ALARM_CHANNEL, JSON.stringify(message));

      logger.info(`Alarm webhook: published event for "${region.regionName}" (alert=${isAlert}).`);
    }),
  );
}

/**
 * Builds the alarm webhook Express router.
 * @param publisher - A connected Redis client used to publish alarm events.
 * @returns An Express router mounted at `/webhook/alarm` (POST).
 */
export function createAlarmWebhookRouter(publisher: AlarmPublisher) {
  const router = Router();

  router.post('/webhook/alarm', (request: Request, response: Response) => {
    if (!isAuthorized(request)) {
      logger.warn('Alarm webhook: unauthorized request rejected.');
      response.status(401).json({ error: 'Unauthorized' });

      return;
    }

    const payload = request.body as unknown;

    if (!Array.isArray(payload)) {
      logger.warn('Alarm webhook: invalid payload (expected array).');
      response.status(400).json({ error: 'Invalid payload: expected an array of region alerts.' });

      return;
    }

    // Respond immediately — Stfalcon expects a fast 200 response.
    response.status(200).json({ ok: true });

    processWebhookPayload(publisher, payload as StfalconRegionAlert[]).catch((error) => {
      logger.error(error, 'Alarm webhook: failed to publish alarm events.');
    });
  });

  return router;
}
