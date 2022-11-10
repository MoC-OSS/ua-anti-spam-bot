import express from 'express';

import { environmentConfig } from './config';

export const runBotExpressServer = () => {
  const app = express();

  app.get('/health-check', (request, response) => response.json({ status: 'ok' }));

  app.listen(environmentConfig.BOT_PORT, environmentConfig.BOT_HOST, () => {
    console.info(`Bot-server started on http://${environmentConfig.BOT_HOST}:${environmentConfig.BOT_PORT}`);
  });

  return app;
};
