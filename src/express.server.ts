import * as tf from '@tensorflow/tfjs-node';
import express from 'express';
import type { RouteParameters } from 'express-serve-static-core';
import multer from 'multer';

import { environmentConfig } from './config';
import { processHandler } from './express-logic';
import { initSwindlersContainer, S3Service } from './services';
import { initNsfwTensor, initTensor } from './tensor';
import type {
  ParseVideoRequestBody,
  ParseVideoResponseBody,
  ProcessRequestBody,
  ProcessResponseBody,
  SwindlerRequestBody,
  SwindlerResponseBody,
  TensorRequestBody,
  TensorResponseBody,
} from './types';
import { videoService } from './video';

const uploadMemoryStorage = multer.memoryStorage();
const uploadMiddleware = multer({ storage: uploadMemoryStorage });

(async () => {
  /**
   * Tensorflow.js offers two flags, enableProdMode and enableDebugMode.
   * If you're going to use any TF model in production, be sure to enable prod mode before loading models.
   * */
  if (environmentConfig.ENV === 'production') {
    tf.enableProdMode();
  }

  const s3Service = new S3Service();

  const tensorService = await initTensor(s3Service);
  const nsfwTensorService = await initNsfwTensor();
  const { swindlersDetectService } = await initSwindlersContainer();

  const app = express();
  const expressStartTime = new Date().toString();

  app.use(express.json());
  app.get('/healthcheck', (request, response) => response.json({ status: 'ok' }));
  app.post<'/process', RouteParameters<'/process'>, ProcessResponseBody, ProcessRequestBody>('/process', (request, response) => {
    const startTime = performance.now();
    const { message, datasetPath, strict } = request.body;

    const result = processHandler.processHandler(message, datasetPath, strict);
    const endTime = performance.now();
    const time = endTime - startTime;

    if (environmentConfig.DEBUG) {
      console.info({ route: '/process', result, datasetPath, time, expressStartTime });
    }

    response.json({ result, time, expressStartTime });
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  app.post<'/tensor', RouteParameters<'/tensor'>, TensorResponseBody, TensorRequestBody>('/tensor', async (request, response) => {
    const startTime = performance.now();
    const { message, rate } = request.body;

    const result = await tensorService.predict(message, rate);
    const endTime = performance.now();

    const time = endTime - startTime;

    if (environmentConfig.DEBUG) {
      console.info({ route: '/tensor', result, time, expressStartTime });
    }

    response.json({ result, time, expressStartTime });
  });

  app.post<'/swindlers', RouteParameters<'/swindlers'>, SwindlerResponseBody, SwindlerRequestBody>(
    '/swindlers',
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (request, response) => {
      const startTime = performance.now();
      const { message } = request.body;

      const result = await swindlersDetectService.isSwindlerMessage(message);
      const endTime = performance.now();

      const time = endTime - startTime;

      if (environmentConfig.DEBUG) {
        console.info({ route: '/swindlers', result, time, expressStartTime });
      }

      response.json({ result, time, expressStartTime });
    },
  );

  app.post<'/parse-video', RouteParameters<'/parse-video'>, ParseVideoResponseBody, ParseVideoRequestBody>(
    '/parse-video',
    uploadMiddleware.single('video'),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
        console.info({ route: '/parse-video', screenshots, time, expressStartTime });
      }

      return response.json({ screenshots: screenshots.map((screenshot) => screenshot.toJSON()), time, expressStartTime });
    },
  );

  app.post<'/image', RouteParameters<'/image'>>(
    '/image',
    uploadMiddleware.array('image', 10),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
        console.info({ route: '/image', result, time, expressStartTime });
      }

      return response.json({ result, time, expressStartTime });
    },
  );

  app.listen(environmentConfig.PORT, environmentConfig.HOST, () => {
    console.info(`Backend server started on http://${environmentConfig.HOST}:${environmentConfig.PORT}`);
  });
})().catch((error) => {
  console.error('Cannot start server. Reason:', error);
});
