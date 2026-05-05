/**
 * @module alarm-webhook.router
 * @description Express router that receives alarm webhook payloads from the Stfalcon API
 * and publishes them to the Redis alarm channel for the bot process to consume.
 *
 * Security: every incoming request is verified using RSA-SHA256 signature validation.
 * The signature is transmitted in the `X-Webhook-Signature` header and is computed over
 * the string `${X-Webhook-Timestamp}.${rawBody}`.
 *
 * In local development (ENV=local) the signature check is skipped so ngrok testing works
 * without a valid key pair.
 */

import crypto from 'node:crypto';

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

/** Expected value of the `X-Webhook-Signature-Alg` header. */
const EXPECTED_ALGORITHM = 'rsa-sha256';

/**
 * Verifies the RSA-SHA256 signature of an incoming Stfalcon webhook request.
 *
 * The signed payload is `${timestamp}.${rawBody}` as described in the Stfalcon docs.
 * @param headers - The incoming request headers object.
 * @param rawBody - The raw UTF-8 request body string (must be captured before JSON parsing).
 * @param publicKeyPem - The RSA public key in PEM format.
 * @returns `true` when the signature is valid; `false` otherwise.
 */
function verifyWebhookSignature(headers: Request['headers'], rawBody: string, publicKeyPem: string): boolean {
  const signature = headers['x-webhook-signature'];
  const timestamp = headers['x-webhook-timestamp'];
  const algorithm = (headers['x-webhook-signature-alg'] ?? '').toString().toLowerCase();

  if (!signature || !timestamp) {
    logger.warn('Alarm webhook: missing required signature headers.');

    return false;
  }

  if (algorithm && algorithm !== EXPECTED_ALGORITHM) {
    logger.warn(`Alarm webhook: unsupported signature algorithm "${algorithm}".`);

    return false;
  }

  const payload = `${timestamp}.${rawBody}`;

  try {
    const verifier = crypto.createVerify('RSA-SHA256');

    verifier.update(payload, 'utf8');
    verifier.end();

    return verifier.verify(publicKeyPem, Buffer.from(signature.toString(), 'base64'));
  } catch (error) {
    logger.error(error, 'Alarm webhook: error during signature verification.');

    return false;
  }
}

/**
 * Returns true if the incoming request passes authentication.
 * In local development the check is bypassed to simplify ngrok testing.
 * @param request - The incoming Express request (must have `rawBody` populated by the json verify callback).
 * @returns `true` when the request is allowed to proceed; `false` otherwise.
 */
function isAuthorized(request: Request): boolean {
  if (environmentConfig.ENV === 'local') {
    return true;
  }

  const publicKeyPem = environmentConfig.ALARM_WEBHOOK_PUBLIC_KEY_PEM;

  if (!publicKeyPem) {
    logger.warn('Alarm webhook: ALARM_WEBHOOK_PUBLIC_KEY_PEM is not configured — requests will be rejected.');

    return false;
  }

  const rawBody = request.rawBody ?? '';

  return verifyWebhookSignature(request.headers, rawBody, publicKeyPem);
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
 *
 * **Important:** this router relies on `request.rawBody` being pre-populated by the
 * `express.json({ verify })` callback configured in `server/index.ts`. The raw body
 * is required for RSA-SHA256 signature verification.
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
