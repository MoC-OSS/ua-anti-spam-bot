import express from 'express';

import { environmentConfig } from './config';

export const runBotExpressServer = () => {
  const app = express();

  app.get('/health-check', (request, response) => response.json({ status: 'ok' }));

  app.listen(environmentConfig.BOT_PORT, environmentConfig.BOT_HOST, () => {
    console.info(`App started on http://localhost:${environmentConfig.PORT}`);
  });

  return app;
};
