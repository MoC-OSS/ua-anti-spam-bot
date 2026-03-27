import express from 'express';
import request from 'supertest';

import { ALARM_CHANNEL } from '@db/redis-pubsub';

import { createAlarmWebhookRouter } from '@server/alarm-webhook.router';

import type { StfalconRegionAlert } from '@app-types/stfalcon-alarm';

vi.mock('@db/redis-pubsub', () => ({
  ALARM_CHANNEL: 'alarm:updates',
}));

vi.mock('@shared/config', () => ({
  environmentConfig: {
    ENV: 'test',
    ALARM_WEBHOOK_SECRET: 'test-secret',
  },
}));

const publishMock = vi.fn().mockResolvedValue(1);

const mockPublisher = {
  publish: publishMock,
};

/**
 *
 */
function buildApp() {
  const app = express();

  app.use(express.json());
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

        const response = await request(app).post('/webhook/alarm').set('x-alarm-secret', 'test-secret').send(payload).expect(200);

        expect(response.body).toEqual({ ok: true });

        // Give async processWebhookPayload time to complete
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

        await request(app).post('/webhook/alarm').set('x-alarm-secret', 'test-secret').send(payload).expect(200);

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

        await request(app).post('/webhook/alarm').set('x-alarm-secret', 'test-secret').send(payload).expect(200);

        await vi.waitFor(() => {
          expect(publishMock).toHaveBeenCalledTimes(2);
        });
      });
    });

    describe('negative cases', () => {
      it('should respond 401 when the secret header is missing', async () => {
        await request(app).post('/webhook/alarm').send([]).expect(401);

        expect(publishMock).not.toHaveBeenCalled();
      });

      it('should respond 401 when the secret header is incorrect', async () => {
        await request(app).post('/webhook/alarm').set('x-alarm-secret', 'wrong-secret').send([]).expect(401);

        expect(publishMock).not.toHaveBeenCalled();
      });

      it('should respond 400 when the payload is not an array', async () => {
        const response = await request(app).post('/webhook/alarm').set('x-alarm-secret', 'test-secret').send({ regionId: '4' }).expect(400);

        expect(response.body.error).toContain('array');
        expect(publishMock).not.toHaveBeenCalled();
      });
    });
  });
});
