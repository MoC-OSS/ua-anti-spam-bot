import crypto from 'node:crypto';

import express from 'express';
import request from 'supertest';

import { ALARM_CHANNEL } from '@db/redis-pubsub';

import { createAlarmWebhookRouter } from '@server/alarm-webhook.router';

import type { StfalconRegionAlert } from '@app-types/stfalcon-alarm';

vi.mock('@db/redis-pubsub', () => ({
  ALARM_CHANNEL: 'alarm:updates',
}));

// Generate a test RSA key pair inside vi.hoisted so it is available when the
// vi.mock factory for @shared/config is evaluated (mocks are hoisted before imports).
const { privateKey, testPublicKeyPem } = vi.hoisted(() => {
  type CryptoGenerateKeyPairSync = (
    type: 'rsa',
    options: { modulusLength: number; publicKeyEncoding: object; privateKeyEncoding: object },
  ) => { privateKey: string; publicKey: string };

  // eslint-disable-next-line global-require
  const { generateKeyPairSync } = require('node:crypto') as { generateKeyPairSync: CryptoGenerateKeyPairSync };

  const { privateKey: pk, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return { privateKey: pk, testPublicKeyPem: publicKey };
});

vi.mock('@shared/config', () => ({
  environmentConfig: {
    ENV: 'test',
    ALARM_WEBHOOK_PUBLIC_KEY_PEM: testPublicKeyPem,
  },
}));

const publishMock = vi.fn().mockResolvedValue(1);

const mockPublisher = {
  publish: publishMock,
};

/**
 * Signs `${timestamp}.${rawBody}` with the test private key and returns the Base64 signature.
 * @param timestamp
 * @param rawBody
 */
function signPayload(timestamp: string, rawBody: string): string {
  const signer = crypto.createSign('RSA-SHA256');

  signer.update(`${timestamp}.${rawBody}`, 'utf8');
  signer.end();

  return signer.sign(privateKey, 'base64');
}

/**
 * Builds the Express app the same way server/index.ts does:
 * captures rawBody in the express.json verify callback.
 */
function buildApp() {
  const app = express();

  app.use(
    express.json({
      verify: (incomingRequest, _response, rawBuffer) => {
        // eslint-disable-next-line no-param-reassign
        incomingRequest.rawBody = rawBuffer.toString('utf8');
      },
    }),
  );

  app.use(createAlarmWebhookRouter(mockPublisher));

  return app;
}

describe('createAlarmWebhookRouter', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
    vi.clearAllMocks();
  });

  describe('POST /webhook/alarm', () => {
    describe('positive cases', () => {
      it('should respond 200 and publish alarm-start events to Redis', async () => {
        const payload: StfalconRegionAlert[] = [
          {
            regionId: '4',
            regionName: 'Львівська область',
            regionType: 'State',
            lastUpdate: '2024-01-01T12:00:00Z',
            activeAlerts: [{ regionId: '4', regionType: 'State', type: 'AIR', lastUpdate: '2024-01-01T12:00:00Z' }],
          },
        ];

        const rawBody = JSON.stringify(payload);
        const timestamp = String(Math.floor(Date.now() / 1000));
        const signature = signPayload(timestamp, rawBody);

        const response = await request(app)
          .post('/webhook/alarm')
          .set('Content-Type', 'application/json')
          .set('x-webhook-timestamp', timestamp)
          .set('x-webhook-signature', signature)
          .set('x-webhook-signature-alg', 'rsa-sha256')
          .send(rawBody)
          .expect(200);

        expect(response.body).toEqual({ ok: true });

        await vi.waitFor(() => {
          expect(publishMock).toHaveBeenCalledWith(
            ALARM_CHANNEL,
            JSON.stringify({
              regionId: '4',
              regionName: 'Львівська область',
              alert: true,
              alertType: 'AIR',
              lastUpdate: '2024-01-01T12:00:00Z',
            }),
          );
        });
      });

      it('should publish alert=false when activeAlerts is empty (all-clear)', async () => {
        const payload: StfalconRegionAlert[] = [
          {
            regionId: '4',
            regionName: 'Львівська область',
            regionType: 'State',
            lastUpdate: '2024-01-01T14:00:00Z',
            activeAlerts: [],
          },
        ];

        const rawBody = JSON.stringify(payload);
        const timestamp = String(Math.floor(Date.now() / 1000));
        const signature = signPayload(timestamp, rawBody);

        await request(app)
          .post('/webhook/alarm')
          .set('Content-Type', 'application/json')
          .set('x-webhook-timestamp', timestamp)
          .set('x-webhook-signature', signature)
          .set('x-webhook-signature-alg', 'rsa-sha256')
          .send(rawBody)
          .expect(200);

        await vi.waitFor(() => {
          expect(publishMock).toHaveBeenCalledWith(
            ALARM_CHANNEL,
            JSON.stringify({
              regionId: '4',
              regionName: 'Львівська область',
              alert: false,
              alertType: null,
              lastUpdate: '2024-01-01T14:00:00Z',
            }),
          );
        });
      });

      it('should publish one message per region in the payload', async () => {
        const payload: StfalconRegionAlert[] = [
          {
            regionId: '4',
            regionName: 'Львівська область',
            regionType: 'State',
            lastUpdate: '2024-01-01T12:00:00Z',
            activeAlerts: [{ regionId: '4', regionType: 'State', type: 'AIR', lastUpdate: '2024-01-01T12:00:00Z' }],
          },
          {
            regionId: '5',
            regionName: 'Київська область',
            regionType: 'State',
            lastUpdate: '2024-01-01T12:05:00Z',
            activeAlerts: [],
          },
        ];

        const rawBody = JSON.stringify(payload);
        const timestamp = String(Math.floor(Date.now() / 1000));
        const signature = signPayload(timestamp, rawBody);

        await request(app)
          .post('/webhook/alarm')
          .set('Content-Type', 'application/json')
          .set('x-webhook-timestamp', timestamp)
          .set('x-webhook-signature', signature)
          .set('x-webhook-signature-alg', 'rsa-sha256')
          .send(rawBody)
          .expect(200);

        await vi.waitFor(() => {
          expect(publishMock).toHaveBeenCalledTimes(2);
        });
      });

      it('should accept request without x-webhook-signature-alg header', async () => {
        const payload: StfalconRegionAlert[] = [];
        const rawBody = JSON.stringify(payload);
        const timestamp = String(Math.floor(Date.now() / 1000));
        const signature = signPayload(timestamp, rawBody);

        const response = await request(app)
          .post('/webhook/alarm')
          .set('Content-Type', 'application/json')
          .set('x-webhook-timestamp', timestamp)
          .set('x-webhook-signature', signature)
          .send(rawBody)
          .expect(200);

        expect(response.body).toEqual({ ok: true });
      });
    });

    describe('negative cases', () => {
      it('should respond 401 when signature headers are missing', async () => {
        await request(app).post('/webhook/alarm').send([]).expect(401);

        expect(publishMock).not.toHaveBeenCalled();
      });

      it('should respond 401 when the signature is invalid', async () => {
        const timestamp = String(Math.floor(Date.now() / 1000));

        await request(app)
          .post('/webhook/alarm')
          .set('Content-Type', 'application/json')
          .set('x-webhook-timestamp', timestamp)
          .set('x-webhook-signature', Buffer.from('invalid-signature').toString('base64'))
          .set('x-webhook-signature-alg', 'rsa-sha256')
          .send(JSON.stringify([]))
          .expect(401);

        expect(publishMock).not.toHaveBeenCalled();
      });

      it('should respond 401 when the algorithm is not rsa-sha256', async () => {
        const timestamp = String(Math.floor(Date.now() / 1000));

        await request(app)
          .post('/webhook/alarm')
          .set('Content-Type', 'application/json')
          .set('x-webhook-timestamp', timestamp)
          .set('x-webhook-signature', 'anything')
          .set('x-webhook-signature-alg', 'hmac-sha256')
          .send(JSON.stringify([]))
          .expect(401);

        expect(publishMock).not.toHaveBeenCalled();
      });

      it('should respond 400 when the payload is not an array', async () => {
        const rawBody = JSON.stringify({ regionId: '4' });
        const timestamp = String(Math.floor(Date.now() / 1000));
        const signature = signPayload(timestamp, rawBody);

        const response = await request(app)
          .post('/webhook/alarm')
          .set('Content-Type', 'application/json')
          .set('x-webhook-timestamp', timestamp)
          .set('x-webhook-signature', signature)
          .set('x-webhook-signature-alg', 'rsa-sha256')
          .send(rawBody)
          .expect(400);

        expect(response.body.error).toContain('array');
        expect(publishMock).not.toHaveBeenCalled();
      });
    });
  });
});
