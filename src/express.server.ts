import express from 'express';
import type { RouteParameters } from 'express-serve-static-core';

import { environmentConfig } from './config';
import { processHandler } from './express-logic';
import { initSwindlersContainer, S3Service } from './services';
import { initTensor } from './tensor';
import type {
  ProcessRequestBody,
  ProcessResponseBody,
  SwindlerRequestBody,
  SwindlerResponseBody,
  TensorRequestBody,
  TensorResponseBody,
} from './types';

(async () => {
  const s3Service = new S3Service();

  const tensorService = await initTensor(s3Service);
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

  app.listen(environmentConfig.PORT, environmentConfig.HOST, () => {
    console.info(`App started on http://locahost:${environmentConfig.PORT}`);
  });
})().catch((error) => {
  console.error('Cannot start server. Reason:', error);
});
