import crypto from 'node:crypto';

import express from 'express';
import type { RouteParameters } from 'express-serve-static-core';
import multer from 'multer';

import { createAlarmPublisher } from '@db/redis-pubsub';

import { S3Service } from '@services/s3.service';
import { stfalconAlarmApiService } from '@services/stfalcon-alarm-api.service';
import { initSwindlersContainer } from '@services/swindlers.container';

import { environmentConfig } from '@shared/config';

import { initNsfwTensor } from '@tensor/nsfw-tensor.service';
import { initTensor } from '@tensor/tensor.service';
import * as tf from '@tensorflow/tfjs-node';

import type {
  ParseVideoRequestBody,
  ParseVideoResponseBody,
  ProcessRequestBody,
  ProcessResponseBody,
  SwindlerRequestBody,
  SwindlerResponseBody,
  TensorRequestBody,
  TensorResponseBody,
} from '@app-types/express';

import { logger } from '@utils/logger.util';

import { videoService } from '@video/video.service';

import { createAlarmWebhookRouter } from './alarm-webhook.router';
import { processHandler } from './process.handler';

const uploadMemoryStorage = multer.memoryStorage();
// eslint-disable-next-line sonarjs/content-length
const uploadMiddleware = multer({ storage: uploadMemoryStorage });

/**
 * Validates server startup configuration and logs actionable errors for any
 * misconfigured values that would cause silent runtime failures.
 * @param config - The loaded environment configuration object.
 *
 * TODO: Replace manual checks here with a Zod schema (e.g. `serverConfigSchema.parse(config)`)
 * once the project migrates to Zod for env validation. Each check below maps directly to a
 * schema field: string fields become `z.string()`, PEM fields add `.refine(validatePem)`, etc.
 */
function validateServerConfig(config: typeof environmentConfig): void {
  const publicKeyPem = config.ALARM_WEBHOOK_PUBLIC_KEY_PEM;

  if (publicKeyPem) {
    try {
      crypto.createPublicKey(publicKeyPem);
      logger.info('Server config: ALARM_WEBHOOK_PUBLIC_KEY_PEM is valid.');
    } catch {
      logger.error(
        'Server config: ALARM_WEBHOOK_PUBLIC_KEY_PEM is set but invalid ' +
          '(malformed PEM or newlines replaced with spaces in the secrets store). ' +
          'All POST /webhook/alarm requests will be rejected with 401.',
      );
    }
  } else if (!config.DISABLE_ALARM_API) {
    logger.warn('Server config: ALARM_WEBHOOK_PUBLIC_KEY_PEM is not set — webhook signature verification will reject all requests.');
  }
}

(async () => {
  validateServerConfig(environmentConfig);

  /**
   * Tensorflow.js offers two flags, enableProdMode and enableDebugMode.
   * If you're going to use any TF model in production, be sure to enable prod mode before loading models.
   */
  if (environmentConfig.ENV === 'production') {
    tf.enableProdMode();
  }

  // Start health-check endpoint immediately so ALB probes pass during model loading.
  // eslint-disable-next-line sonarjs/x-powered-by
  const app = express();

  // Capture raw body before JSON parsing — required for RSA webhook signature verification.
  app.use(
    express.json({
      verify: (incomingRequest, _response, rawBuffer) => {
        // eslint-disable-next-line no-param-reassign
        incomingRequest.rawBody = rawBuffer.toString('utf8');
      },
    }),
  );

  app.get('/healthcheck', (request, response) => response.json({ status: 'ok' }));

  app.listen(environmentConfig.PORT, environmentConfig.HOST, () => {
    logger.info(`Health-check server started on http://${environmentConfig.HOST}:${environmentConfig.PORT}`);
  });

  const s3Service = new S3Service();

  const tensorService = await initTensor(s3Service);
  const nsfwTensorService = await initNsfwTensor();
  const { swindlersDetectService } = await initSwindlersContainer();

  const expressStartTime = new Date().toString();

  app.post<'/process', RouteParameters<'/process'>, ProcessResponseBody, ProcessRequestBody>('/process', (request, response) => {
    const startTime = performance.now();
    const { message, datasetPath, strict } = request.body;

    const result = processHandler.processHandler(message, datasetPath, strict);
    const endTime = performance.now();
    const time = endTime - startTime;

    if (environmentConfig.DEBUG) {
      logger.info({ route: '/process', result, datasetPath, time, expressStartTime });
    }

    response.json({ result, time, expressStartTime });
  });

  app.post<'/tensor', RouteParameters<'/tensor'>, TensorResponseBody, TensorRequestBody>('/tensor', async (request, response) => {
    const startTime = performance.now();
    const { message, rate } = request.body;

    const result = await tensorService.predict(message, rate);
    const endTime = performance.now();

    const time = endTime - startTime;

    if (environmentConfig.DEBUG) {
      logger.info({ route: '/tensor', result, time, expressStartTime });
    }

    response.json({ result, time, expressStartTime });
  });

  app.post<'/swindlers', RouteParameters<'/swindlers'>, SwindlerResponseBody, SwindlerRequestBody>(
    '/swindlers',

    async (request, response) => {
      const startTime = performance.now();
      const { message } = request.body;

      const result = await swindlersDetectService.isSwindlerMessage(message);
      const endTime = performance.now();

      const time = endTime - startTime;

      if (environmentConfig.DEBUG) {
        logger.info({ route: '/swindlers', result, time, expressStartTime });
      }

      response.json({ result, time, expressStartTime });
    },
  );

  app.post<'/parse-video', RouteParameters<'/parse-video'>, ParseVideoResponseBody, ParseVideoRequestBody>(
    '/parse-video',
    uploadMiddleware.single('video'),

    async (request, response) => {
      const startTime = performance.now();
      const video = request.file;
      const { duration } = request.body;

      if (!video) {
        return response.status(400).json({ error: 'no video' });
      }

      const screenshots = await videoService.extractFrames(video.buffer, video.originalname, duration ? +duration : undefined);

      const endTime = performance.now();

      const time = endTime - startTime;

      if (environmentConfig.DEBUG) {
        logger.info({ route: '/parse-video', screenshots, time, expressStartTime });
      }

      return response.json({ screenshots: screenshots.map((screenshot) => screenshot.toJSON()), time, expressStartTime });
    },
  );

  app.post<'/image', RouteParameters<'/image'>>(
    '/image',
    uploadMiddleware.array('image', 10),

    async (request, response) => {
      const startTime = performance.now();

      const images = ((request.files?.['image'] as Express.Multer.File[]) || request.files)
        .filter((field) => field.fieldname === 'image')
        .map((field) => field.buffer);

      if (!images) {
        return response.status(400).json({ error: 'no image' });
      }

      const result = await nsfwTensorService.predictVideo(images);

      const endTime = performance.now();

      const time = endTime - startTime;

      if (environmentConfig.DEBUG) {
        logger.info({ route: '/image', result, time, expressStartTime });
      }

      return response.json({ result, time, expressStartTime });
    },
  );

  logger.info('Backend API routes registered. Server is fully ready.');

  const newMemoryUsage = process.memoryUsage();

  logger.info(`Memory Usage: ${newMemoryUsage.rss / 1024 / 1024} MB`);

  // Initialize Redis publisher and mount the alarm webhook route.
  if (!environmentConfig.DISABLE_ALARM_API) {
    try {
      const alarmPublisher = await createAlarmPublisher();

      app.use(createAlarmWebhookRouter(alarmPublisher));
      logger.info('Alarm webhook route mounted at POST /webhook/alarm.');

      // Register (or re-register) the webhook URL with the Stfalcon API.
      if (environmentConfig.ALARM_WEBHOOK_BASE_URL) {
        const webhookUrl = `${environmentConfig.ALARM_WEBHOOK_BASE_URL}/webhook/alarm`;

        await stfalconAlarmApiService.registerWebhook(webhookUrl).catch(async (error) => {
          logger.warn(`Alarm webhook registration failed, attempting update: ${(error as Error).message}`);

          await stfalconAlarmApiService.updateWebhook(webhookUrl).catch((updateError: unknown) => {
            logger.error(updateError, 'Alarm webhook update also failed');
          });
        });
      } else {
        logger.warn('ALARM_WEBHOOK_BASE_URL is not set — skipping Stfalcon webhook registration.');
      }
    } catch (error) {
      logger.error(error, 'Failed to initialize alarm webhook infrastructure');
    }
  }
})().catch((error) => {
  logger.error('Cannot start server. Reason:', error);
});
